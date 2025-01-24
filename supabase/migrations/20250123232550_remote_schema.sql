drop policy "view_staff_profiles" on "public"."profiles";

drop policy "Users can create ticket comments" on "public"."ticket_comments";

drop policy "Users can view ticket comments" on "public"."ticket_comments";

alter table "public"."team_members" drop constraint "team_members_user_id_fkey";

alter table "public"."tickets" drop constraint "tickets_assigned_to_fkey";

alter table "public"."tickets" drop constraint "tickets_created_by_fkey";

alter table "public"."team_capacity" add column "current_tickets" integer not null default 0;

alter table "public"."team_capacity" add column "is_available" boolean not null default true;

alter table "public"."team_capacity" add column "last_assigned" timestamp with time zone;

alter table "public"."tickets" drop column "metadata";

alter table "public"."tickets" alter column "category" set default 'other'::ticket_category;

alter table "public"."team_members" add constraint "team_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."team_members" validate constraint "team_members_user_id_fkey";

alter table "public"."tickets" add constraint "tickets_assigned_to_fkey" FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."tickets" validate constraint "tickets_assigned_to_fkey";

alter table "public"."tickets" add constraint "tickets_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."tickets" validate constraint "tickets_created_by_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.auto_assign_ticket()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_team_id uuid;
  v_agent_id uuid;
begin
  -- Set customer_id if not set (for customer-created tickets)
  if new.customer_id is null and new.created_on_behalf = false then
    new.customer_id := new.created_by;
  end if;

  -- Find suitable team
  v_team_id := find_suitable_team(new.category, new.priority, new.metadata::jsonb);
  
  if v_team_id is not null then
    -- Update ticket with team
    new.team_id := v_team_id;
    
    -- Find suitable agent
    v_agent_id := find_suitable_agent(v_team_id);
    
    if v_agent_id is not null then
      -- Assign to agent
      new.assigned_to := v_agent_id;
      new.status := 'open'::ticket_status;
      
      -- Update agent capacity
      update team_capacity
      set current_tickets = current_tickets + 1,
          last_assigned = now()
      where team_id = v_team_id and agent_id = v_agent_id;
    end if;
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.find_suitable_agent(p_team_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_agent_id uuid;
begin
  -- Find available agent with least current tickets
  select agent_id into v_agent_id
  from team_capacity
  where team_id = p_team_id
    and is_available = true
    and current_tickets < max_tickets
  order by current_tickets asc
  limit 1;

  return v_agent_id;
end;
$function$
;

create policy "Admins can manage all profiles"
on "public"."profiles"
as permissive
for all
to public
using (((auth.jwt() ->> 'role'::text) = 'admin'::text));


create policy "View profiles"
on "public"."profiles"
as permissive
for select
to public
using (((auth.uid() = id) OR (EXISTS ( SELECT 1
   FROM profiles profiles_1
  WHERE ((profiles_1.id = auth.uid()) AND ((profiles_1.role)::text = ANY (ARRAY['admin'::text, 'agent'::text])))))));


create policy "Team members can view routing rules"
on "public"."routing_rules"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM team_members
  WHERE ((team_members.team_id = routing_rules.team_id) AND (team_members.user_id = auth.uid())))));


create policy "Agents and admins can manage team members"
on "public"."team_members"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::user_role, 'agent'::user_role]))))));


create policy "View team members"
on "public"."team_members"
as permissive
for select
to public
using (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::user_role, 'agent'::user_role])))))));


create policy "Admins can manage all comments"
on "public"."ticket_comments"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role)))));


create policy "Users can update own ticket comments"
on "public"."ticket_comments"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can create ticket comments"
on "public"."ticket_comments"
as permissive
for insert
to public
with check (((EXISTS ( SELECT 1
   FROM tickets
  WHERE ((tickets.id = ticket_comments.ticket_id) AND ((tickets.created_by = auth.uid()) OR (tickets.assigned_to = auth.uid()) OR (tickets.team_id IN ( SELECT team_members.team_id
           FROM team_members
          WHERE (team_members.user_id = auth.uid()))))))) AND ((is_internal = false) OR ((is_internal = true) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role = 'admin'::user_role) OR (profiles.role = 'agent'::user_role)))))))));


create policy "Users can view ticket comments"
on "public"."ticket_comments"
as permissive
for select
to public
using (((EXISTS ( SELECT 1
   FROM tickets
  WHERE ((tickets.id = ticket_comments.ticket_id) AND ((tickets.created_by = auth.uid()) OR (tickets.assigned_to = auth.uid()) OR (tickets.team_id IN ( SELECT team_members.team_id
           FROM team_members
          WHERE (team_members.user_id = auth.uid()))))))) AND ((is_internal = false) OR ((is_internal = true) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role = 'admin'::user_role) OR (profiles.role = 'agent'::user_role)))))))));



