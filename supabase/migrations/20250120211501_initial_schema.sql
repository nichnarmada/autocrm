-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create role enum
create type user_role as enum (
  'admin',
  'agent',
  'customer'
);

-- Create profiles table
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  avatar_url text,
  role user_role not null default 'customer',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add RLS policies for profiles
alter table profiles enable row level security;

-- Allow users to view their own profile
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

-- Allow users to update their own profile
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Create profile on signup trigger
create or replace function public.handle_new_user()
returns trigger as $$
declare
  default_role user_role := 'customer';
begin
  -- Get role from metadata, default to customer if not specified
  if new.raw_user_meta_data->>'role' is not null then
    default_role := (new.raw_user_meta_data->>'role')::user_role;
  end if;

  insert into public.profiles (
    id,
    full_name,
    avatar_url,
    role,
    email
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'temp_display_name'),
    new.raw_user_meta_data->>'avatar_url',
    default_role,
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create enum types
create type ticket_status as enum (
  'new',
  'open',
  'in_progress',
  'resolved',
  'closed'
);

create type ticket_priority as enum (
  'low',
  'medium',
  'high',
  'urgent'
);

-- Create teams table
create table teams (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create team_members table
create table team_members (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid references teams(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(team_id, user_id)
);

-- Create tickets table
create table tickets (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  status ticket_status not null default 'new',
  priority ticket_priority not null default 'medium',
  created_by uuid references auth.users(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  team_id uuid references teams(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create comments table
create table ticket_comments (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid references tickets(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  content text not null,
  is_internal boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Set up RLS policies
alter table teams enable row level security;
alter table team_members enable row level security;
alter table tickets enable row level security;
alter table ticket_comments enable row level security;

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

-- Team members policies
create policy "Users can view team members"
  on team_members for select
  using (
    auth.uid() = user_id
  );

-- Tickets policies
create policy "Users can view assigned tickets"
  on tickets for select
  using (
    auth.uid() = assigned_to
    or auth.uid() = created_by
    or exists (
      select 1 from team_members
      where team_members.team_id = tickets.team_id
      and team_members.user_id = auth.uid()
    )
  );

create policy "Users can create tickets"
  on tickets for insert
  with check (auth.uid() = created_by);

create policy "Assigned users can update tickets"
  on tickets for update
  using (
    auth.uid() = assigned_to
    or auth.uid() in (
      select user_id from team_members 
      where team_id = tickets.team_id 
      and role in ('admin', 'manager')
    )
  );

-- Comments policies
create policy "Users can view ticket comments"
  on ticket_comments for select
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_comments.ticket_id
      and (
        t.created_by = auth.uid()
        or t.assigned_to = auth.uid()
        or t.team_id in (
          select team_id from team_members where user_id = auth.uid()
        )
      )
    )
  );

-- Create updated_at trigger function
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add updated_at triggers
create trigger set_updated_at
  before update on teams
  for each row
  execute function handle_updated_at();

create trigger set_updated_at
  before update on team_members
  for each row
  execute function handle_updated_at();

create trigger set_updated_at
  before update on tickets
  for each row
  execute function handle_updated_at();

create trigger set_updated_at
  before update on ticket_comments
  for each row
  execute function handle_updated_at();

-- Add updated_at trigger for profiles
create trigger set_profile_updated_at
  before update on profiles
  for each row
  execute function handle_updated_at(); 