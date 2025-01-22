-- Drop recursive policies
drop policy if exists "Team members can view team members" on team_members;
drop policy if exists "Team members can view their teams" on teams;

-- Create simpler team policies
create policy "View team members"
  on team_members for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'agent')
    )
  );

create policy "View teams"
  on teams for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'agent')
    )
  ); 