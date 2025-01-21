-- Drop existing policies
drop policy if exists "Users can view team members" on team_members;
drop policy if exists "Team members viewing policy" on team_members;

-- Create separate policies for admins and regular users
create policy "Admins can view all team members"
  on team_members for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Users can view their own team memberships"
  on team_members for select
  using (
    user_id = auth.uid()
  );

-- Add policy for inserting team members (only admins)
create policy "Enable insert for admins"
  on team_members for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  ); 