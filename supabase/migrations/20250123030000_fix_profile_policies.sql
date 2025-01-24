-- Drop all existing profile policies to start fresh
drop policy if exists "Users can view own profile" on profiles;
drop policy if exists "Admins can view all profiles" on profiles;
drop policy if exists "View profiles" on profiles;
drop policy if exists "View own profile" on profiles;
drop policy if exists "Admin agent view all profiles" on profiles;
drop policy if exists "profiles_visibility" on profiles;
drop policy if exists "view_own_profile" on profiles;
drop policy if exists "admin_agent_view_all" on profiles;
drop policy if exists "allow_profile_access" on profiles;

-- Create policy for admins and agents to view staff profiles
create policy "view_staff_profiles"
  on profiles for select
  using (
    -- Only allow viewing admin and agent profiles
    role in ('admin', 'agent')
    -- Only admins and agents can view these profiles
    and exists (
      select 1 from profiles viewer
      where viewer.id = auth.uid()
      and viewer.role in ('admin', 'agent')
    )
  ); 