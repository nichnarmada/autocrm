-- Enable RLS
alter table "public"."teams" enable row level security;

-- Create policies
create policy "Enable read access for all users" on "public"."teams"
  for select using (true);

create policy "Enable insert access for admins" on "public"."teams"
  for insert with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Enable update access for admins" on "public"."teams"
  for update using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Enable delete access for admins" on "public"."teams"
  for delete using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  ); 