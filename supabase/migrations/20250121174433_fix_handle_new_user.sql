-- Drop existing trigger first
drop trigger if exists on_auth_user_created on auth.users;

-- Drop existing function
drop function if exists handle_new_user();

-- Create updated function that properly handles role from metadata
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    full_name,
    avatar_url,
    role,
    email
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'temp_display_name'),
    new.raw_user_meta_data->>'avatar_url',
    (new.raw_user_meta_data->>'role')::user_role, -- This will now properly cast the role
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

-- Recreate the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user(); 