-- Drop all existing profile policies to ensure clean slate
drop policy if exists "Admins can view all profiles" on profiles;
drop policy if exists "Agents can view profiles" on profiles;
drop policy if exists "Users can view own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Agents and admins can view profiles" on profiles;
drop policy if exists "Anyone can view own profile" on profiles;
drop policy if exists "Anyone can update own profile" on profiles;
drop policy if exists "Admins and agents can view all profiles" on profiles;

-- Create new non-recursive policies
create policy "basic_profile_select"
  on profiles for select
  using (
    -- Users can always read their own profile
    auth.uid() = id
    -- Admins and agents can read all profiles (using a non-recursive check)
    or auth.jwt()->>'role' in ('admin', 'agent')
  );

create policy "basic_profile_update"
  on profiles for update
  using (auth.uid() = id);

-- Update team member policies to use JWT claim instead of recursive check
drop policy if exists "Admins and agents can manage team members" on team_members;

create policy "team_member_management"
  on team_members for all
  using (auth.jwt()->>'role' in ('admin', 'agent')); 