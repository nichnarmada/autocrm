-- Drop the trigger first
drop trigger if exists on_auth_user_created on auth.users;

-- Drop the existing function
drop function if exists handle_new_user();

-- Recreate the function with proper role casting
create or replace function handle_new_user()
returns trigger 
security definer
set search_path = public
language plpgsql
as $$
declare
  profile_exists boolean;
  user_role user_role;
begin
  -- Determine user role based on metadata
  -- For invited users, always set as agent
  if new.raw_user_meta_data->>'is_invited' = 'true' then
    user_role := 'agent'::user_role;
  else
    -- For regular sign-ups, always set as customer
    user_role := 'customer'::user_role;
  end if;

  -- Set the role in JWT claim
  update auth.users 
  set raw_app_meta_data = 
    coalesce(raw_app_meta_data, '{}'::jsonb) || 
    json_build_object('role', user_role::text)::jsonb
  where id = new.id;

  -- Check if profile exists
  select exists (
    select 1 from public.profiles where id = new.id
  ) into profile_exists;

  if not profile_exists then
    insert into public.profiles (
      id,
      full_name,
      avatar_url,
      email,
      role,
      is_profile_setup,
      created_at,
      updated_at
    ) values (
      new.id,
      coalesce(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'temp_display_name',
        split_part(new.email, '@', 1)
      ),
      new.raw_user_meta_data->>'avatar_url',
      new.email,
      user_role,
      false,
      now(),
      now()
    );
  end if;

  return new;
end;
$$;

-- Recreate the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user(); 