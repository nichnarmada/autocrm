SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.8

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

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '9514b96e-f4d3-4bf5-b981-52dd9af17b1a', '{"action":"user_confirmation_requested","actor_id":"d78c0532-e001-47d3-a17b-e15e3d6d1e04","actor_username":"nichnarmada@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-01-21 02:05:06.419546+00', ''),
	('00000000-0000-0000-0000-000000000000', '0d3ce7dc-d97c-4177-a4c7-f9748b58972d', '{"action":"user_signedup","actor_id":"d78c0532-e001-47d3-a17b-e15e3d6d1e04","actor_username":"nichnarmada@gmail.com","actor_via_sso":false,"log_type":"team"}', '2025-01-21 02:05:53.098721+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f5a3a8c0-ab1d-4c17-bf83-8a829174d0f1', '{"action":"login","actor_id":"d78c0532-e001-47d3-a17b-e15e3d6d1e04","actor_username":"nichnarmada@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"email"}}', '2025-01-21 02:05:53.672376+00', ''),
	('00000000-0000-0000-0000-000000000000', '94121e4b-a658-4628-b855-527efeb1033d', '{"action":"token_refreshed","actor_id":"d78c0532-e001-47d3-a17b-e15e3d6d1e04","actor_username":"nichnarmada@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-01-21 14:39:09.189215+00', ''),
	('00000000-0000-0000-0000-000000000000', '7475c61a-4885-4a5e-8747-7b7c93ea48f5', '{"action":"token_revoked","actor_id":"d78c0532-e001-47d3-a17b-e15e3d6d1e04","actor_username":"nichnarmada@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-01-21 14:39:09.198897+00', ''),
	('00000000-0000-0000-0000-000000000000', 'da795290-213f-46e4-905b-759e1ce2a209', '{"action":"token_refreshed","actor_id":"d78c0532-e001-47d3-a17b-e15e3d6d1e04","actor_username":"nichnarmada@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-01-21 14:39:09.239984+00', ''),
	('00000000-0000-0000-0000-000000000000', '34f127b2-2f93-449f-b730-af3c470033ac', '{"action":"token_refreshed","actor_id":"d78c0532-e001-47d3-a17b-e15e3d6d1e04","actor_username":"nichnarmada@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-01-21 17:24:11.672764+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cf3991fc-1dfa-424a-9826-64e4ea8666fd', '{"action":"token_revoked","actor_id":"d78c0532-e001-47d3-a17b-e15e3d6d1e04","actor_username":"nichnarmada@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-01-21 17:24:11.67372+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'd78c0532-e001-47d3-a17b-e15e3d6d1e04', 'authenticated', 'authenticated', 'nichnarmada@gmail.com', '$2a$10$BDDHsFSh8D6ifOP4SeccGOhtglTe2cD1cfd3pLJ348cB8.6ute85K', '2025-01-21 02:05:53.100305+00', NULL, '', '2025-01-21 02:05:06.428399+00', '', NULL, '', '', NULL, '2025-01-21 02:05:53.672863+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "d78c0532-e001-47d3-a17b-e15e3d6d1e04", "email": "nichnarmada@gmail.com", "email_verified": true, "phone_verified": false, "temp_display_name": "nichnarmada"}', NULL, '2025-01-21 02:05:06.387822+00', '2025-01-21 17:24:11.675959+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('d78c0532-e001-47d3-a17b-e15e3d6d1e04', 'd78c0532-e001-47d3-a17b-e15e3d6d1e04', '{"sub": "d78c0532-e001-47d3-a17b-e15e3d6d1e04", "email": "nichnarmada@gmail.com", "email_verified": true, "phone_verified": false, "temp_display_name": "nichnarmada"}', 'email', '2025-01-21 02:05:06.413901+00', '2025-01-21 02:05:06.413949+00', '2025-01-21 02:05:06.413949+00', 'f498a932-f7ab-485c-9a5c-9b28ac2fb80a');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag") VALUES
	('672e47ba-5345-48c3-b1bd-f7f1ef5a079c', 'd78c0532-e001-47d3-a17b-e15e3d6d1e04', '2025-01-21 02:05:53.672941+00', '2025-01-21 17:24:11.678427+00', NULL, 'aal1', NULL, '2025-01-21 17:24:11.678355', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', '97.177.50.89', NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('672e47ba-5345-48c3-b1bd-f7f1ef5a079c', '2025-01-21 02:05:53.680242+00', '2025-01-21 02:05:53.680242+00', 'email/signup', 'd1b5cbf1-9bb8-4dd7-b14c-46b7b63c317f');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 1, 'zVBgpsyXlZgzHjs4lo5KqA', 'd78c0532-e001-47d3-a17b-e15e3d6d1e04', true, '2025-01-21 02:05:53.675925+00', '2025-01-21 14:39:09.199462+00', NULL, '672e47ba-5345-48c3-b1bd-f7f1ef5a079c'),
	('00000000-0000-0000-0000-000000000000', 2, 'W89lw5Jcp3BqSa8topAmig', 'd78c0532-e001-47d3-a17b-e15e3d6d1e04', true, '2025-01-21 14:39:09.206355+00', '2025-01-21 17:24:11.674215+00', 'zVBgpsyXlZgzHjs4lo5KqA', '672e47ba-5345-48c3-b1bd-f7f1ef5a079c'),
	('00000000-0000-0000-0000-000000000000', 3, 'fo6xkgpXL4u66v2G72MAEA', 'd78c0532-e001-47d3-a17b-e15e3d6d1e04', false, '2025-01-21 17:24:11.674875+00', '2025-01-21 17:24:11.674875+00', 'W89lw5Jcp3BqSa8topAmig', '672e47ba-5345-48c3-b1bd-f7f1ef5a079c');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: key; Type: TABLE DATA; Schema: pgsodium; Owner: supabase_admin
--



--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("id", "full_name", "avatar_url", "role", "created_at", "updated_at", "email") VALUES
	('d78c0532-e001-47d3-a17b-e15e3d6d1e04', 'nichnarmada', NULL, 'admin', '2025-01-21 02:05:06.387455+00', '2025-01-21 02:37:14.96104+00', NULL);


--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: team_members; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: ticket_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 3, true);


--
-- Name: key_key_id_seq; Type: SEQUENCE SET; Schema: pgsodium; Owner: supabase_admin
--

SELECT pg_catalog.setval('"pgsodium"."key_key_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

RESET ALL;
