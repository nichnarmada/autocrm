-- Enable required extensions
create extension if not exists "pg_graphql";
create extension if not exists "pg_stat_statements";
create extension if not exists "pgcrypto";
create extension if not exists "pgjwt";
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

-- Create handle_new_user function with proper role casting
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

create table routing_rules (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid references teams on delete cascade not null,
  category ticket_category,
  priority ticket_priority,
  conditions jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table team_capacity (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid references teams on delete cascade not null,
  agent_id uuid references profiles on delete cascade not null,
  max_tickets integer not null default 10,
  current_tickets integer not null default 0,
  is_available boolean not null default true,
  last_assigned timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(team_id, agent_id)
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
  customer_id uuid references profiles(id) on delete set null,
  created_on_behalf boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table ticket_comments (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid references tickets on delete cascade not null,
  user_id uuid references profiles(id) on delete set null,
  content text not null,
  is_internal boolean default false,
  attachments jsonb default '[]'::jsonb,
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
  before update on routing_rules
  for each row execute function handle_updated_at();

create trigger set_updated_at
  before update on team_capacity
  for each row execute function handle_updated_at();

create trigger set_updated_at
  before update on tickets
  for each row execute function handle_updated_at();

create trigger set_updated_at
  before update on ticket_comments
  for each row execute function handle_updated_at();

-- Create routing functions
create or replace function find_suitable_team(
  p_category ticket_category,
  p_priority ticket_priority,
  p_metadata jsonb
) returns uuid as $$
declare
  v_team_id uuid;
begin
  -- Find matching team based on routing rules
  select team_id into v_team_id
  from routing_rules
  where (category is null or category = p_category)
    and (priority is null or priority = p_priority)
  limit 1;

  return v_team_id;
end;
$$ language plpgsql security definer;

create or replace function find_suitable_agent(p_team_id uuid)
returns uuid as $$
declare
  v_agent_id uuid;
begin
  -- Find available agent with least current tickets
  select agent_id into v_agent_id
  from team_capacity
  where team_id = p_team_id
    and is_available = true
    and current_tickets < max_tickets
  order by current_tickets asc
  limit 1;

  return v_agent_id;
end;
$$ language plpgsql security definer;

create or replace function auto_assign_ticket()
returns trigger as $$
declare
  v_team_id uuid;
  v_agent_id uuid;
begin
  -- Set customer_id if not set (for customer-created tickets)
  if new.customer_id is null and new.created_on_behalf = false then
    new.customer_id := new.created_by;
  end if;

  -- Find suitable team
  v_team_id := find_suitable_team(new.category, new.priority, new.metadata::jsonb);
  
  if v_team_id is not null then
    -- Update ticket with team
    new.team_id := v_team_id;
    
    -- Find suitable agent
    v_agent_id := find_suitable_agent(v_team_id);
    
    if v_agent_id is not null then
      -- Assign to agent
      new.assigned_to := v_agent_id;
      new.status := 'open'::ticket_status;
      
      -- Update agent capacity
      update team_capacity
      set current_tickets = current_tickets + 1,
          last_assigned = now()
      where team_id = v_team_id and agent_id = v_agent_id;
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for auto-assignment
create trigger ticket_auto_assign
  before insert on tickets
  for each row execute function auto_assign_ticket();

-- Enable RLS
alter table profiles enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;
alter table routing_rules enable row level security;
alter table team_capacity enable row level security;
alter table tickets enable row level security;
alter table ticket_comments enable row level security;

-- Create RLS policies
-- Profile policies
create policy "basic_profile_select"
  on profiles for select
  using (
    -- Users can always read their own profile
    auth.uid() = id
    -- Admins and agents can read all profiles (using JWT claim)
    or auth.jwt()->>'role' in ('admin', 'agent')
  );

create policy "basic_profile_update"
  on profiles for update
  using (auth.uid() = id);

-- Team policies
create policy "View teams"
  on teams for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'agent')
    )
  );

-- Team member policies
create policy "team_member_management"
  on team_members for all
  using (auth.jwt()->>'role' in ('admin', 'agent'));

-- Routing rules policies
create policy "Admins can manage routing rules"
  on routing_rules for all
  using ((auth.jwt() ->> 'role')::text = 'admin');

-- Team capacity policies
create policy "Admins can manage team capacity"
  on team_capacity for all
  using ((auth.jwt() ->> 'role')::text = 'admin');

create policy "Agents can view own capacity"
  on team_capacity for select
  using (agent_id = auth.uid());

-- Ticket policies
create policy "Customers can view own tickets"
  on tickets for select
  using (
    auth.uid() = customer_id
    or (
      exists (
        select 1 from profiles
        where profiles.id = auth.uid()
        and profiles.role in ('admin', 'agent')
      )
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
create policy "Users can view ticket comments"
  on ticket_comments for select
  using (
    exists (
      select 1 from tickets
      where tickets.id = ticket_comments.ticket_id
      and (
        tickets.created_by = auth.uid() or
        tickets.assigned_to = auth.uid() or
        tickets.team_id in (
          select team_id from team_members
          where user_id = auth.uid()
        )
      )
    ) and (
      (is_internal = false) or
      (
        is_internal = true and
        exists (
          select 1 from profiles
          where id = auth.uid()
          and role in ('admin', 'agent')
        )
      )
    )
  );

create policy "Users can create ticket comments"
  on ticket_comments for insert
  with check (
    exists (
      select 1 from tickets
      where tickets.id = ticket_id
      and (
        tickets.created_by = auth.uid() or
        tickets.assigned_to = auth.uid() or
        tickets.team_id in (
          select team_id from team_members
          where user_id = auth.uid()
        )
      )
    ) and (
      (is_internal = false) or
      (
        is_internal = true and
        exists (
          select 1 from profiles
          where id = auth.uid()
          and role in ('admin', 'agent')
        )
      )
    )
  );

create policy "Users can update own comments"
  on ticket_comments for update
  using (user_id = auth.uid());

create policy "Users can delete own comments"
  on ticket_comments for delete
  using (user_id = auth.uid());

-- Create indexes for performance
create index if not exists idx_ticket_comments_ticket_id on ticket_comments(ticket_id);
create index if not exists idx_ticket_comments_user_id on ticket_comments(user_id);
create index if not exists idx_ticket_comments_created_at on ticket_comments(created_at desc);

-- Enable realtime
begin;
  -- Drop if exists to avoid errors on re-run
  drop publication if exists supabase_realtime;

  -- Create publication for real-time
  create publication supabase_realtime;

  -- Add tables to publication with all operations
  alter publication supabase_realtime add table tickets;
  alter publication supabase_realtime add table ticket_comments;

  -- Enable replication for tickets
  alter table tickets replica identity full;
  alter table ticket_comments replica identity full;
commit;

-- Grant permissions
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;
grant all on all routines in schema public to postgres, anon, authenticated, service_role; 