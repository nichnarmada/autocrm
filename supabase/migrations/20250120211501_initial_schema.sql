-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Create types
create type user_role as enum ('admin', 'agent', 'customer');
create type ticket_status as enum ('new', 'open', 'in_progress', 'resolved', 'closed');
create type ticket_priority as enum ('low', 'medium', 'high', 'urgent');
create type ticket_category as enum ('bug', 'feature_request', 'support', 'question', 'documentation', 'enhancement', 'other');

-- Create updated_at trigger function
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create handle_new_user function
create or replace function handle_new_user()
returns trigger 
security definer
set search_path = public
language plpgsql
as $$
declare
  profile_exists boolean;
begin
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
      coalesce(
        (new.raw_user_meta_data->>'role')::user_role,
        'customer'
      ),
      false,
      now(),
      now()
    );
  end if;

  return new;
end;
$$;

-- Create tables
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  email text,
  role user_role not null default 'customer',
  is_profile_setup boolean not null default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table teams (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table team_members (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid references teams on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text not null default 'member',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(team_id, user_id)
);

create table tickets (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  status ticket_status not null default 'new',
  priority ticket_priority not null default 'medium',
  category ticket_category not null default 'other',
  created_by uuid references auth.users on delete set null,
  assigned_to uuid references auth.users on delete set null,
  team_id uuid references teams on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table ticket_comments (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid references tickets on delete cascade not null,
  user_id uuid references auth.users on delete set null,
  content text not null,
  is_internal boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create triggers for updated_at
create trigger set_updated_at
  before update on profiles
  for each row execute function handle_updated_at();

create trigger set_updated_at
  before update on teams
  for each row execute function handle_updated_at();

create trigger set_updated_at
  before update on team_members
  for each row execute function handle_updated_at();

create trigger set_updated_at
  before update on tickets
  for each row execute function handle_updated_at();

create trigger set_updated_at
  before update on ticket_comments
  for each row execute function handle_updated_at();

-- Enable RLS
alter table profiles enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;
alter table tickets enable row level security;
alter table ticket_comments enable row level security;

-- Create RLS policies
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on profiles for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

create policy "Admins can manage all profiles"
  on profiles for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- Teams policies
create policy "Team members can view their teams"
  on teams for select
  using (
    exists (
      select 1 from team_members
      where team_members.team_id = teams.id
      and team_members.user_id = auth.uid()
    )
  );

create policy "Admins can manage teams"
  on teams for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

create policy "Team members can view team members"
  on team_members for select
  using (
    exists (
      select 1 from team_members
      where team_id = team_members.team_id
      and user_id = auth.uid()
    )
  );

create policy "Admins can manage team members"
  on team_members for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

create policy "Users can view assigned tickets"
  on tickets for select
  using (
    auth.uid() = assigned_to or
    auth.uid() = created_by or
    team_id in (
      select team_id from team_members
      where user_id = auth.uid()
    )
  );

create policy "Users can create tickets"
  on tickets for insert
  with check (auth.uid() = created_by);

create policy "Assigned users can update tickets"
  on tickets for update
  using (
    auth.uid() = assigned_to or
    auth.uid() in (
      select user_id from team_members
      where team_id = tickets.team_id
      and role in ('admin', 'manager')
    )
  );

create policy "Users can view ticket comments"
  on ticket_comments for select
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_comments.ticket_id
      and (
        t.created_by = auth.uid() or
        t.assigned_to = auth.uid() or
        t.team_id in (
          select team_id from team_members
          where user_id = auth.uid()
        )
      )
    )
  );

create policy "Users can create ticket comments"
  on ticket_comments for insert
  with check (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and (
        t.created_by = auth.uid() or
        t.assigned_to = auth.uid() or
        t.team_id in (
          select team_id from team_members
          where user_id = auth.uid()
        )
      )
    )
  );

create policy "Users can update own ticket comments"
  on ticket_comments for update
  using (auth.uid() = user_id);

-- Grant permissions
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;
grant all on all routines in schema public to postgres, anon, authenticated, service_role; 