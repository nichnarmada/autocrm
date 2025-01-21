-- Drop all existing policies
drop policy if exists "Users can view team members" on team_members;
drop policy if exists "Team members viewing policy" on team_members;
drop policy if exists "Admins can view all team members" on team_members;
drop policy if exists "Users can view their own team memberships" on team_members;
drop policy if exists "Enable insert for admins" on team_members;
drop policy if exists "Enable read access for all users" on teams;
drop policy if exists "Admins can view all teams" on teams;
drop policy if exists "Users can view teams they are members of" on teams;

-- Simplified policy for teams
create policy "Teams access policy"
  on teams for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and (
        profiles.role = 'admin'
        or auth.uid() in (
          select user_id from team_members tm
          where tm.team_id = teams.id
        )
      )
    )
  );

-- Simplified policy for team members
create policy "Team members access policy"
  on team_members for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
    or auth.uid() = user_id
  );

-- Admin-only insert policy for team members
create policy "Team members insert policy"
  on team_members for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  ); 