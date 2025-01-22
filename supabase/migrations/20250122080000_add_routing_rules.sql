-- Create routing rules table
create table routing_rules (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid references teams on delete cascade not null,
  category ticket_category,
  priority ticket_priority,
  conditions jsonb, -- Additional matching conditions
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create team capacity tracking
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

-- Create function to find suitable team
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

-- Create function to find suitable agent
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

-- Create function to auto-assign ticket
create or replace function auto_assign_ticket()
returns trigger as $$
declare
  v_team_id uuid;
  v_agent_id uuid;
begin
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

-- Add RLS policies
alter table routing_rules enable row level security;
alter table team_capacity enable row level security;

-- Only admins can manage routing rules
create policy "Admins can manage routing rules"
  on routing_rules for all
  using ((auth.jwt() ->> 'role')::text = 'admin');

-- Team members can view routing rules
create policy "Team members can view routing rules"
  on routing_rules for select
  using (
    exists (
      select 1 from team_members
      where team_members.team_id = routing_rules.team_id
      and team_members.user_id = auth.uid()
    )
  );

-- Team capacity policies
create policy "Admins can manage team capacity"
  on team_capacity for all
  using ((auth.jwt() ->> 'role')::text = 'admin');

create policy "Agents can view own capacity"
  on team_capacity for select
  using (agent_id = auth.uid());

-- Update triggers
create trigger set_updated_at
  before update on routing_rules
  for each row execute function handle_updated_at();

create trigger set_updated_at
  before update on team_capacity
  for each row execute function handle_updated_at(); 