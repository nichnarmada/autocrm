-- Drop existing read policy
drop policy if exists "Enable read access for all users" on teams;

-- Create separate read policies for admins and regular users
create policy "Admins can view all teams"
  on teams for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Users can view teams they are members of"
  on teams for select
  using (
    exists (
      select 1 from team_members
      where team_members.team_id = id
      and team_members.user_id = auth.uid()
    )
  ); 