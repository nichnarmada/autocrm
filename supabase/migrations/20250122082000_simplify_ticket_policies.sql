-- Drop existing ticket policies
drop policy if exists "Users can view assigned tickets" on tickets;
drop policy if exists "Customers can view own tickets" on tickets;
drop policy if exists "Agents can view tickets" on tickets;

-- Create simpler policies
-- Customers can only view their own tickets
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