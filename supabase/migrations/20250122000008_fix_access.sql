-- First disable RLS
alter table profiles disable row level security;
alter table teams disable row level security;
alter table team_members disable row level security;
alter table tickets disable row level security;
alter table ticket_comments disable row level security;

-- Add basic policies for authenticated users
create policy "Allow authenticated access to profiles"
on profiles for all
using (auth.role() = 'authenticated');

create policy "Allow authenticated access to teams"
on teams for all
using (auth.role() = 'authenticated');

create policy "Allow authenticated access to team_members"
on team_members for all
using (auth.role() = 'authenticated');

create policy "Allow authenticated access to tickets"
on tickets for all
using (auth.role() = 'authenticated');

create policy "Allow authenticated access to ticket_comments"
on ticket_comments for all
using (auth.role() = 'authenticated');

-- Re-enable RLS with the new policies
alter table profiles enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;
alter table tickets enable row level security;
alter table ticket_comments enable row level security; 