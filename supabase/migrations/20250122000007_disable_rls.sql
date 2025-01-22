-- Disable RLS on all tables
alter table if exists profiles disable row level security;
alter table if exists teams disable row level security;
alter table if exists team_members disable row level security;
alter table if exists tickets disable row level security;
alter table if exists ticket_comments disable row level security;

-- Drop all policies
drop policy if exists "Users can view their own profile" on profiles;
drop policy if exists "Users can update their own profile" on profiles;
drop policy if exists "Team members can view team" on teams;
drop policy if exists "Team members can view team members" on team_members;
drop policy if exists "Team members can view tickets" on tickets;
drop policy if exists "Team members can view ticket comments" on ticket_comments;
drop policy if exists "Team members can create tickets" on tickets;
drop policy if exists "Team members can create ticket comments" on ticket_comments;
drop policy if exists "Team members can update tickets" on tickets;
drop policy if exists "Team members can update ticket comments" on ticket_comments; 