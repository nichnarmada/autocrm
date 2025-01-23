-- Drop existing profile policies that might conflict
drop policy if exists "Admins can view all profiles" on profiles;
drop policy if exists "Agents can view profiles" on profiles;
drop policy if exists "Users can view own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Agents and admins can view profiles" on profiles;

-- Create simplified profile policies
create policy "Anyone can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Anyone can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Admins and agents can view all profiles"
  on profiles for select
  using (
    (select role from profiles where id = auth.uid()) in ('admin', 'agent')
  );

-- Drop existing team member policies
drop policy if exists "Team members can view team members" on team_members;
drop policy if exists "Admins can manage team members" on team_members;
drop policy if exists "Agents and admins can manage team members" on team_members;

-- Update team member policies
create policy "Admins and agents can manage team members"
  on team_members for all
  using (
    (select role from profiles where id = auth.uid()) in ('admin', 'agent')
  ); 