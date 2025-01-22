

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."ticket_category" AS ENUM (
    'bug',
    'feature_request',
    'support',
    'question',
    'documentation',
    'enhancement',
    'other'
);


ALTER TYPE "public"."ticket_category" OWNER TO "postgres";


CREATE TYPE "public"."ticket_priority" AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE "public"."ticket_priority" OWNER TO "postgres";


CREATE TYPE "public"."ticket_status" AS ENUM (
    'new',
    'open',
    'in_progress',
    'resolved',
    'closed'
);


ALTER TYPE "public"."ticket_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'admin',
    'agent',
    'customer'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_assign_ticket"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."auto_assign_ticket"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_suitable_agent"("p_team_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."find_suitable_agent"("p_team_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_suitable_team"("p_category" "public"."ticket_category", "p_priority" "public"."ticket_priority", "p_metadata" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_team_id uuid;
begin
  -- Find matching team based on routing rules
  select team_id into v_team_id
  from routing_rules
  where (category is null or category = p_category)
    and (priority is null or priority = p_priority)
  limit 1;

  return v_team_id;
end;
$$;


ALTER FUNCTION "public"."find_suitable_team"("p_category" "public"."ticket_category", "p_priority" "public"."ticket_priority", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  profile_exists boolean;
  user_role user_role;
begin
  -- Get the role from metadata, cast it properly to user_role enum
  user_role := coalesce(
    (new.raw_user_meta_data->>'role')::user_role,
    'customer'::user_role
  );

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


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "email" "text",
    "role" "public"."user_role" DEFAULT 'customer'::"public"."user_role" NOT NULL,
    "is_profile_setup" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."routing_rules" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "team_id" "uuid" NOT NULL,
    "category" "public"."ticket_category",
    "priority" "public"."ticket_priority",
    "conditions" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."routing_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_capacity" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "team_id" "uuid" NOT NULL,
    "agent_id" "uuid" NOT NULL,
    "max_tickets" integer DEFAULT 10 NOT NULL,
    "current_tickets" integer DEFAULT 0 NOT NULL,
    "is_available" boolean DEFAULT true NOT NULL,
    "last_assigned" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."team_capacity" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "team_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."team_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_comments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "content" "text" NOT NULL,
    "is_internal" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ticket_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tickets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "public"."ticket_status" DEFAULT 'new'::"public"."ticket_status" NOT NULL,
    "priority" "public"."ticket_priority" DEFAULT 'medium'::"public"."ticket_priority" NOT NULL,
    "category" "public"."ticket_category" DEFAULT 'other'::"public"."ticket_category" NOT NULL,
    "created_by" "uuid",
    "assigned_to" "uuid",
    "team_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "customer_id" "uuid",
    "created_on_behalf" boolean DEFAULT false
);


ALTER TABLE "public"."tickets" OWNER TO "postgres";


ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."routing_rules"
    ADD CONSTRAINT "routing_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_capacity"
    ADD CONSTRAINT "team_capacity_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_capacity"
    ADD CONSTRAINT "team_capacity_team_id_agent_id_key" UNIQUE ("team_id", "agent_id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_id_user_id_key" UNIQUE ("team_id", "user_id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_comments"
    ADD CONSTRAINT "ticket_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."routing_rules" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."team_capacity" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."team_members" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."teams" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."ticket_comments" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."tickets" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "ticket_auto_assign" BEFORE INSERT ON "public"."tickets" FOR EACH ROW EXECUTE FUNCTION "public"."auto_assign_ticket"();



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."routing_rules"
    ADD CONSTRAINT "routing_rules_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_capacity"
    ADD CONSTRAINT "team_capacity_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_capacity"
    ADD CONSTRAINT "team_capacity_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ticket_comments"
    ADD CONSTRAINT "ticket_comments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ticket_comments"
    ADD CONSTRAINT "ticket_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE SET NULL;



CREATE POLICY "Admins can manage all profiles" ON "public"."profiles" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can manage routing rules" ON "public"."routing_rules" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can manage team capacity" ON "public"."team_capacity" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can manage team members" ON "public"."team_members" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can manage teams" ON "public"."teams" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can view all profiles" ON "public"."profiles" FOR SELECT USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Agents can create tickets on behalf" ON "public"."tickets" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'agent'::"public"."user_role"]))))) AND ("created_on_behalf" = true) AND ("auth"."uid"() = "created_by")));



CREATE POLICY "Agents can update tickets" ON "public"."tickets" FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'agent'::"public"."user_role"]))))) AND (("auth"."uid"() = "assigned_to") OR ("team_id" IN ( SELECT "team_members"."team_id"
   FROM "public"."team_members"
  WHERE ("team_members"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Agents can view own capacity" ON "public"."team_capacity" FOR SELECT USING (("agent_id" = "auth"."uid"()));



CREATE POLICY "Customers can create tickets" ON "public"."tickets" FOR INSERT WITH CHECK ((("auth"."uid"() = "customer_id") AND ("created_on_behalf" = false)));



CREATE POLICY "Customers can view own tickets" ON "public"."tickets" FOR SELECT USING ((("auth"."uid"() = "customer_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'agent'::"public"."user_role"])))))));



CREATE POLICY "Team members can view routing rules" ON "public"."routing_rules" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."team_members"
  WHERE (("team_members"."team_id" = "routing_rules"."team_id") AND ("team_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create ticket comments" ON "public"."ticket_comments" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."tickets" "t"
  WHERE (("t"."id" = "ticket_comments"."ticket_id") AND (("t"."created_by" = "auth"."uid"()) OR ("t"."assigned_to" = "auth"."uid"()) OR ("t"."team_id" IN ( SELECT "team_members"."team_id"
           FROM "public"."team_members"
          WHERE ("team_members"."user_id" = "auth"."uid"()))))))));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own ticket comments" ON "public"."ticket_comments" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view ticket comments" ON "public"."ticket_comments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."tickets" "t"
  WHERE (("t"."id" = "ticket_comments"."ticket_id") AND (("t"."created_by" = "auth"."uid"()) OR ("t"."assigned_to" = "auth"."uid"()) OR ("t"."team_id" IN ( SELECT "team_members"."team_id"
           FROM "public"."team_members"
          WHERE ("team_members"."user_id" = "auth"."uid"()))))))));



CREATE POLICY "View team members" ON "public"."team_members" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'agent'::"public"."user_role"])))))));



CREATE POLICY "View teams" ON "public"."teams" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'agent'::"public"."user_role"]))))));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."routing_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_capacity" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ticket_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tickets" ENABLE ROW LEVEL SECURITY;


CREATE PUBLICATION "realtime_messages_publication_v2_34_1" WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION "realtime_messages_publication_v2_34_1" OWNER TO "supabase_admin";




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."auto_assign_ticket"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_assign_ticket"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_assign_ticket"() TO "service_role";



GRANT ALL ON FUNCTION "public"."find_suitable_agent"("p_team_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."find_suitable_agent"("p_team_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_suitable_agent"("p_team_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."find_suitable_team"("p_category" "public"."ticket_category", "p_priority" "public"."ticket_priority", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."find_suitable_team"("p_category" "public"."ticket_category", "p_priority" "public"."ticket_priority", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_suitable_team"("p_category" "public"."ticket_category", "p_priority" "public"."ticket_priority", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."routing_rules" TO "anon";
GRANT ALL ON TABLE "public"."routing_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."routing_rules" TO "service_role";



GRANT ALL ON TABLE "public"."team_capacity" TO "anon";
GRANT ALL ON TABLE "public"."team_capacity" TO "authenticated";
GRANT ALL ON TABLE "public"."team_capacity" TO "service_role";



GRANT ALL ON TABLE "public"."team_members" TO "anon";
GRANT ALL ON TABLE "public"."team_members" TO "authenticated";
GRANT ALL ON TABLE "public"."team_members" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_comments" TO "anon";
GRANT ALL ON TABLE "public"."ticket_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_comments" TO "service_role";



GRANT ALL ON TABLE "public"."tickets" TO "anon";
GRANT ALL ON TABLE "public"."tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."tickets" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
