-- Drop all existing policies and functions
drop policy if exists "users_can_view_own_profile" on profiles;
drop policy if exists "staff_can_view_staff_profiles" on profiles;
drop policy if exists "users_can_update_own_profile" on profiles;
drop policy if exists "view_staff_profiles" on profiles;
drop policy if exists "profiles_visibility" on profiles;
drop policy if exists "update_own_profile" on profiles;
drop policy if exists "insert_own_profile" on profiles;
drop function if exists is_admin;
drop function if exists get_user_role;

-- Enable RLS
alter table profiles enable row level security;

-- Simple admin check function
create or replace function auth.is_admin()
returns boolean
language sql
security definer
as $$
  select exists (
    select 1
    from auth.users
    join profiles on auth.users.id = profiles.id
    where auth.users.id = auth.uid()
    and profiles.role = 'admin'
  );
$$;

-- 1. Users can view their own profile
create policy "can_view_own_profile"
on profiles for select
using (
  auth.uid() = id
  or
  auth.is_admin() -- Admins can view all profiles
);

-- 2. Users can update their own profile
create policy "can_update_own_profile"
on profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- 3. Allow users to insert their own profile (needed for signup)
create policy "can_insert_own_profile"
on profiles for insert
with check (auth.uid() = id);

-- 4. Users can delete their own profile
create policy "can_delete_own_profile"
on profiles for delete
using (auth.uid() = id); 