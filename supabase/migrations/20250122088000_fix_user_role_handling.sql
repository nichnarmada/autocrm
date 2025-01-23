-- Update the handle_new_user function to properly handle invited users
create or replace function handle_new_user()
returns trigger as $$
declare
  profile_exists boolean;
  user_role text;
begin
  -- Determine user role
  -- If user is invited, they should always be an agent
  if new.raw_user_meta_data->>'is_invited' = 'true' then
    user_role := 'agent';
  else
    -- For regular sign-ups (not invited), always set as customer
    user_role := 'customer';
  end if;

  -- Set the role in JWT claim
  update auth.users 
  set raw_app_meta_data = 
    coalesce(raw_app_meta_data, '{}'::jsonb) || 
    json_build_object('role', user_role)::jsonb
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
      user_role,  -- Use the determined role
      false,
      now(),
      now()
    );
  end if;

  return new;
end;
$$ language plpgsql security definer; 