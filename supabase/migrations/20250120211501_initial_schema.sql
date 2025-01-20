-- Enable necessary extensions
create extension if not exists "uuid-ossp";

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
    auth.uid() in (
      select user_id from team_members where team_id = teams.id
    )
  );

-- Team members policies
create policy "Users can view team members"
  on team_members for select
  using (
    auth.uid() in (
      select user_id from team_members where team_id = team_members.team_id
    )
  );

-- Tickets policies
create policy "Users can view assigned tickets"
  on tickets for select
  using (
    auth.uid() = assigned_to
    or auth.uid() = created_by
    or auth.uid() in (
      select user_id from team_members where team_id = tickets.team_id
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
    auth.uid() in (
      select created_by from tickets where id = ticket_comments.ticket_id
      union
      select assigned_to from tickets where id = ticket_comments.ticket_id
      union
      select user_id from team_members 
      where team_id = (
        select team_id from tickets where id = ticket_comments.ticket_id
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