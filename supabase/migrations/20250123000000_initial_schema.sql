-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Create enum types
create type user_role as enum ('admin', 'agent', 'customer');
create type ticket_status as enum ('new', 'open', 'in_progress', 'resolved', 'closed');
create type ticket_priority as enum ('low', 'medium', 'high', 'urgent');
create type ticket_category as enum (
  'bug',
  'feature_request',
  'support',
  'question',
  'documentation',
  'enhancement',
  'other'
);

-- Create handle_new_user function
create or replace function handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
declare
  profile_exists boolean;
  user_role user_role;
begin
  -- Determine user role based on metadata
  -- For invited users, always set as agent
  if new.raw_user_meta_data->>'is_invited' = 'true' then
    user_role := 'agent'::user_role;
  else
    -- For regular sign-ups, always set as customer
    user_role := 'customer'::user_role;
  end if;

  -- Set the role in JWT claim
  update auth.users 
  set raw_app_meta_data = 
    coalesce(raw_app_meta_data, '{}'::jsonb) || 
    json_build_object('role', user_role::text)::jsonb
  where id = new.id;

  -- Check if profile exists
  select exists (
    select 1 from public.profiles where id = new.id
  ) into profile_exists;

  if not profile_exists then
    insert into public.profiles (
      id,
      full_name,
      avatar_url,
      email,
      role,
      is_profile_setup,
      created_at,
      updated_at
    ) values (
      new.id,
      coalesce(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'temp_display_name',
        split_part(new.email, '@', 1)
      ),
      new.raw_user_meta_data->>'avatar_url',
      new.email,
      user_role,
      false,
      now(),
      now()
    );
  end if;

  return new;
end;
$$;

-- Grant necessary permissions
grant usage on schema auth to postgres, authenticated, service_role;
grant all on auth.users to postgres, authenticated, service_role;
grant execute on function handle_new_user to postgres, authenticated, service_role;

-- Create auth.users trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Create profiles table (linked to auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  role user_role not null default 'customer',
  is_profile_setup boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create teams table
create table teams (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create team_members table
create table team_members (
  id uuid default uuid_generate_v4() primary key,
  team_id uuid references teams on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (team_id, user_id)
);

-- Create tickets table
create table tickets (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  status ticket_status not null default 'new',
  priority ticket_priority not null default 'medium',
  category ticket_category not null default 'other',
  created_by uuid references profiles(id) on delete set null,
  assigned_to uuid references profiles(id) on delete set null,
  team_id uuid references teams(id) on delete set null,
  customer_id uuid references profiles(id) on delete set null,
  created_on_behalf boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create ticket_comments table
create table ticket_comments (
  id uuid default uuid_generate_v4() primary key,
  ticket_id uuid references tickets on delete cascade not null,
  user_id uuid references profiles(id) on delete set null,
  content text not null,
  is_internal boolean default false,
  attachments jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;
alter table tickets enable row level security;
alter table ticket_comments enable row level security;

-- Create admin check function
create or replace function auth.is_admin()
returns boolean
language sql
security definer
as $$
  select exists (
    select 1
    from auth.users
    join profiles on auth.users.id = profiles.id
    where auth.users.id = auth.uid()
    and profiles.role = 'admin'
  );
$$;

-- Create RLS Policies

-- Profile policies
create policy "can_view_own_profile" 
on profiles for select 
using (auth.uid() = id or auth.is_admin());

create policy "can_update_own_profile" 
on profiles for update 
using (auth.uid() = id) 
with check (auth.uid() = id);

create policy "can_insert_own_profile" 
on profiles for insert 
with check (auth.uid() = id);

create policy "can_delete_own_profile" 
on profiles for delete 
using (auth.uid() = id);

-- Team policies
create policy "View teams" 
on teams for select 
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role::text in ('admin', 'agent')
  )
);

create policy "Admins can create teams" 
on teams for insert 
with check (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role::text = 'admin'
  )
);

create policy "Admins can update teams" 
on teams for update 
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role::text = 'admin'
  )
);

create policy "Admins can delete teams" 
on teams for delete 
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role::text = 'admin'
  )
);

-- Team member policies
create policy "Agents and admins can manage team members" 
on team_members as permissive for all 
to public 
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = any(array['admin'::user_role, 'agent'::user_role])
  )
);

create policy "View team members" 
on team_members as permissive for select 
to public 
using (
  auth.uid() = user_id 
  or exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = any(array['admin'::user_role, 'agent'::user_role])
  )
);

-- Ticket policies
create policy "Customers can view own tickets" 
on tickets for select 
using (
  auth.uid() = customer_id
  or exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role in ('admin', 'agent')
  )
);

create policy "Customers can create tickets" 
on tickets for insert 
with check (
  auth.uid() = customer_id
  and created_on_behalf = false
);

create policy "Agents can create tickets on behalf" 
on tickets for insert 
with check (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role in ('admin', 'agent')
  )
  and created_on_behalf = true
  and auth.uid() = created_by
);

create policy "Agents can update tickets" 
on tickets for update 
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role in ('admin', 'agent')
  )
  and (
    auth.uid() = assigned_to
    or team_id in (
      select team_id from team_members
      where user_id = auth.uid()
    )
  )
);

-- Ticket comment policies
create policy "Admins can manage all comments" 
on ticket_comments as permissive for all 
to public 
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'::user_role
  )
);

create policy "Users can create ticket comments" 
on ticket_comments as permissive for insert 
to public 
with check (
  exists (
    select 1 from tickets
    where tickets.id = ticket_comments.ticket_id
    and (
      tickets.created_by = auth.uid()
      or tickets.assigned_to = auth.uid()
      or tickets.team_id in (
        select team_id from team_members
        where user_id = auth.uid()
      )
    )
  )
  and (
    is_internal = false
    or (
      is_internal = true
      and exists (
        select 1 from profiles
        where profiles.id = auth.uid()
        and profiles.role in ('admin'::user_role, 'agent'::user_role)
      )
    )
  )
);

create policy "Users can view ticket comments" 
on ticket_comments as permissive for select 
to public 
using (
  exists (
    select 1 from tickets
    where tickets.id = ticket_comments.ticket_id
    and (
      tickets.created_by = auth.uid()
      or tickets.assigned_to = auth.uid()
      or tickets.team_id in (
        select team_id from team_members
        where user_id = auth.uid()
      )
    )
  )
  and (
    is_internal = false
    or (
      is_internal = true
      and exists (
        select 1 from profiles
        where profiles.id = auth.uid()
        and profiles.role in ('admin'::user_role, 'agent'::user_role)
      )
    )
  )
);

create policy "Users can update own ticket comments" 
on ticket_comments as permissive for update 
to public 
using (auth.uid() = user_id);

create policy "Users can delete own comments" 
on ticket_comments for delete 
using (auth.uid() = user_id);

-- Create functions and triggers
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create updated_at triggers
create trigger set_updated_at
  before update on profiles
  for each row
  execute procedure set_updated_at();

create trigger set_updated_at
  before update on teams
  for each row
  execute procedure set_updated_at();

create trigger set_updated_at
  before update on team_members
  for each row
  execute procedure set_updated_at();

create trigger set_updated_at
  before update on tickets
  for each row
  execute procedure set_updated_at();

create trigger set_updated_at
  before update on ticket_comments
  for each row
  execute procedure set_updated_at();

-- Create publication for realtime
drop publication if exists supabase_realtime;
create publication supabase_realtime;

-- Enable realtime for all tables
alter publication supabase_realtime add table profiles;
alter publication supabase_realtime add table teams;
alter publication supabase_realtime add table team_members;
alter publication supabase_realtime add table tickets;
alter publication supabase_realtime add table ticket_comments; 