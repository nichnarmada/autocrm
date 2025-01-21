drop policy "Users can view team members" on "public"."team_members";

drop policy "Team members can view their teams" on "public"."teams";

drop policy "Users can view assigned tickets" on "public"."tickets";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'temp_display_name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$function$
;

create policy "Users can view team members"
on "public"."team_members"
as permissive
for select
to public
using (((auth.uid() = user_id) OR (auth.uid() IN ( SELECT tickets.created_by
   FROM tickets
  WHERE (tickets.team_id = team_members.team_id)))));


create policy "Team members can view their teams"
on "public"."teams"
as permissive
for select
to public
using (true);


create policy "Users can view assigned tickets"
on "public"."tickets"
as permissive
for select
to public
using (((auth.uid() = assigned_to) OR (auth.uid() = created_by) OR (team_id IN ( SELECT team_members.team_id
   FROM team_members
  WHERE (team_members.user_id = auth.uid())))));



