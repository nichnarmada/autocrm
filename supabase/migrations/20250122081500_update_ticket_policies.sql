-- Add customer_id to tickets table
alter table tickets
  add column customer_id uuid references profiles(id) on delete set null,
  add column created_on_behalf boolean default false;

-- Drop existing ticket policies
drop policy if exists "Users can view assigned tickets" on tickets;
drop policy if exists "Users can create tickets" on tickets;
drop policy if exists "Assigned users can update tickets" on tickets;

-- Create updated policies
-- Customers can view their own tickets
create policy "Customers can view own tickets"
  on tickets for select
  using (
    auth.uid() = customer_id
    or auth.uid() = created_by
  );

-- Customers can create tickets for themselves
create policy "Customers can create tickets"
  on tickets for insert
  with check (
    auth.uid() = customer_id
    and created_on_behalf = false
  );

-- Agents can view tickets they:
-- 1. Are assigned to
-- 2. Are in their team
-- 3. Are unassigned (status = 'new')
-- 4. Created on behalf of customers
create policy "Agents can view tickets"
  on tickets for select
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
      or status = 'new'
      or created_by = auth.uid()
    )
  );

-- Agents can create tickets on behalf of customers
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

-- Agents can update tickets they are assigned to or in their team
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

-- Update ticket creation trigger to handle customer_id
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