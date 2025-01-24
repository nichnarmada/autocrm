-- Drop existing profile policies
drop policy if exists "basic_profile_select" on profiles;
drop policy if exists "basic_profile_update" on profiles;

-- Create new profile policies
create policy "users_can_view_own_profile"
  on profiles for select
  using (auth.uid() = id);

create policy "staff_can_view_staff_profiles"
  on profiles for select
  using (
    -- If the current user is staff (admin/agent), they can view other staff profiles
    (select role from profiles where id = auth.uid()) in ('admin', 'agent')
    and role in ('admin', 'agent')
  );

create policy "users_can_update_own_profile"
  on profiles for update
  using (auth.uid() = id);
