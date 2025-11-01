--
-- PostgreSQL database dump
--

\restrict cP6Ajma0PVLX3EKOaAOmaoTjKt7CQaAMUKls490MK7ebXxHqt2X1zQt4uMijh4P

-- Dumped from database version 14.19 (Homebrew)
-- Dumped by pg_dump version 14.19 (Homebrew)

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

ALTER TABLE IF EXISTS ONLY public.user_project_roles DROP CONSTRAINT IF EXISTS user_project_roles_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_project_roles DROP CONSTRAINT IF EXISTS user_project_roles_role_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_project_roles DROP CONSTRAINT IF EXISTS user_project_roles_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_groups DROP CONSTRAINT IF EXISTS user_groups_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_groups DROP CONSTRAINT IF EXISTS user_groups_group_id_fkey;
ALTER TABLE IF EXISTS ONLY public.test_suites DROP CONSTRAINT IF EXISTS test_suites_test_plan_id_fkey;
ALTER TABLE IF EXISTS ONLY public.test_suites DROP CONSTRAINT IF EXISTS test_suites_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.test_plans DROP CONSTRAINT IF EXISTS test_plans_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.test_plan_approvals DROP CONSTRAINT IF EXISTS test_plan_approvals_workflow_id_fkey;
ALTER TABLE IF EXISTS ONLY public.test_plan_approvals DROP CONSTRAINT IF EXISTS test_plan_approvals_test_plan_id_fkey;
ALTER TABLE IF EXISTS ONLY public.test_cases DROP CONSTRAINT IF EXISTS test_cases_test_suite_id_fkey;
ALTER TABLE IF EXISTS ONLY public.test_cases DROP CONSTRAINT IF EXISTS test_cases_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_role_id_fkey;
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_permission_id_fkey;
ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS projects_owner_id_fkey;
ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS projects_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.project_roles DROP CONSTRAINT IF EXISTS project_roles_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.organisations DROP CONSTRAINT IF EXISTS organisations_owner_id_fkey;
ALTER TABLE IF EXISTS ONLY public.groups DROP CONSTRAINT IF EXISTS groups_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.group_project_roles DROP CONSTRAINT IF EXISTS group_project_roles_role_id_fkey;
ALTER TABLE IF EXISTS ONLY public.group_project_roles DROP CONSTRAINT IF EXISTS group_project_roles_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.group_project_roles DROP CONSTRAINT IF EXISTS group_project_roles_group_id_fkey;
ALTER TABLE IF EXISTS ONLY public.approval_workflows DROP CONSTRAINT IF EXISTS approval_workflows_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.approval_workflows DROP CONSTRAINT IF EXISTS approval_workflows_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.approval_stages DROP CONSTRAINT IF EXISTS approval_stages_test_plan_approval_id_fkey;
ALTER TABLE IF EXISTS ONLY public.approval_history DROP CONSTRAINT IF EXISTS approval_history_test_plan_approval_id_fkey;
ALTER TABLE IF EXISTS ONLY public.approval_history DROP CONSTRAINT IF EXISTS approval_history_approval_stage_id_fkey;
DROP INDEX IF EXISTS public.ix_users_username;
DROP INDEX IF EXISTS public.ix_users_id;
DROP INDEX IF EXISTS public.ix_users_email;
DROP INDEX IF EXISTS public.ix_projects_owner_id;
DROP INDEX IF EXISTS public.ix_projects_organisation_id;
DROP INDEX IF EXISTS public.ix_projects_name;
DROP INDEX IF EXISTS public.ix_password_reset_codes_user_id;
DROP INDEX IF EXISTS public.ix_password_reset_codes_id;
DROP INDEX IF EXISTS public.ix_password_reset_codes_email;
DROP INDEX IF EXISTS public.ix_organisations_owner_id;
DROP INDEX IF EXISTS public.ix_organisations_name;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.user_project_roles DROP CONSTRAINT IF EXISTS user_project_roles_pkey;
ALTER TABLE IF EXISTS ONLY public.user_groups DROP CONSTRAINT IF EXISTS user_groups_pkey;
ALTER TABLE IF EXISTS ONLY public.test_suites DROP CONSTRAINT IF EXISTS test_suites_pkey;
ALTER TABLE IF EXISTS ONLY public.test_plans DROP CONSTRAINT IF EXISTS test_plans_pkey;
ALTER TABLE IF EXISTS ONLY public.test_plan_approvals DROP CONSTRAINT IF EXISTS test_plan_approvals_test_plan_id_key;
ALTER TABLE IF EXISTS ONLY public.test_plan_approvals DROP CONSTRAINT IF EXISTS test_plan_approvals_pkey;
ALTER TABLE IF EXISTS ONLY public.test_cases DROP CONSTRAINT IF EXISTS test_cases_pkey;
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS projects_pkey;
ALTER TABLE IF EXISTS ONLY public.project_roles DROP CONSTRAINT IF EXISTS project_roles_pkey;
ALTER TABLE IF EXISTS ONLY public.permissions DROP CONSTRAINT IF EXISTS permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.permissions DROP CONSTRAINT IF EXISTS permissions_name_key;
ALTER TABLE IF EXISTS ONLY public.password_reset_codes DROP CONSTRAINT IF EXISTS password_reset_codes_pkey;
ALTER TABLE IF EXISTS ONLY public.organisations DROP CONSTRAINT IF EXISTS organisations_pkey;
ALTER TABLE IF EXISTS ONLY public.groups DROP CONSTRAINT IF EXISTS groups_pkey;
ALTER TABLE IF EXISTS ONLY public.group_project_roles DROP CONSTRAINT IF EXISTS group_project_roles_pkey;
ALTER TABLE IF EXISTS ONLY public.approval_workflows DROP CONSTRAINT IF EXISTS approval_workflows_pkey;
ALTER TABLE IF EXISTS ONLY public.approval_stages DROP CONSTRAINT IF EXISTS approval_stages_pkey;
ALTER TABLE IF EXISTS ONLY public.approval_history DROP CONSTRAINT IF EXISTS approval_history_pkey;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.user_project_roles;
DROP TABLE IF EXISTS public.user_groups;
DROP TABLE IF EXISTS public.test_suites;
DROP TABLE IF EXISTS public.test_plans;
DROP TABLE IF EXISTS public.test_plan_approvals;
DROP TABLE IF EXISTS public.test_cases;
DROP TABLE IF EXISTS public.role_permissions;
DROP TABLE IF EXISTS public.projects;
DROP TABLE IF EXISTS public.project_roles;
DROP TABLE IF EXISTS public.permissions;
DROP TABLE IF EXISTS public.password_reset_codes;
DROP TABLE IF EXISTS public.organisations;
DROP TABLE IF EXISTS public.groups;
DROP TABLE IF EXISTS public.group_project_roles;
DROP TABLE IF EXISTS public.approval_workflows;
DROP TABLE IF EXISTS public.approval_stages;
DROP TABLE IF EXISTS public.approval_history;
DROP TYPE IF EXISTS public.workflowstatus;
DROP TYPE IF EXISTS public.testcasestatus;
DROP TYPE IF EXISTS public.testcasepriority;
DROP TYPE IF EXISTS public.projectstatus;
DROP TYPE IF EXISTS public.generationtype;
DROP TYPE IF EXISTS public.escalationstatus;
DROP TYPE IF EXISTS public.escalationflag;
DROP TYPE IF EXISTS public.approvalstatus;
DROP TYPE IF EXISTS public.approvalrole;
--
-- Name: approvalrole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.approvalrole AS ENUM (
    'QA_LEAD',
    'SENIOR_QA_ENGINEER',
    'QA_MANAGER',
    'PROJECT_MANAGER',
    'PRODUCT_OWNER'
);


--
-- Name: approvalstatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.approvalstatus AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CHANGES_REQUESTED'
);


--
-- Name: escalationflag; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.escalationflag AS ENUM (
    'YES',
    'NO'
);


--
-- Name: escalationstatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.escalationstatus AS ENUM (
    'ENABLED',
    'DISABLED'
);


--
-- Name: generationtype; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.generationtype AS ENUM (
    'AI',
    'MANUAL',
    'HYBRID'
);


--
-- Name: projectstatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.projectstatus AS ENUM (
    'ACTIVE',
    'ARCHIVED',
    'PAUSED'
);


--
-- Name: testcasepriority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.testcasepriority AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


--
-- Name: testcasestatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.testcasestatus AS ENUM (
    'DRAFT',
    'READY',
    'IN_PROGRESS',
    'PASSED',
    'FAILED',
    'BLOCKED',
    'SKIPPED'
);


--
-- Name: workflowstatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.workflowstatus AS ENUM (
    'ACTIVE',
    'INACTIVE'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: approval_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.approval_history (
    id uuid NOT NULL,
    test_plan_approval_id uuid NOT NULL,
    approval_stage_id uuid,
    action character varying(100) NOT NULL,
    actor_email character varying(255) NOT NULL,
    actor_name character varying(255),
    previous_status character varying(50),
    new_status character varying(50),
    comments text,
    changes json,
    notifications_sent json,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: approval_stages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.approval_stages (
    id uuid NOT NULL,
    test_plan_approval_id uuid NOT NULL,
    stage_order integer NOT NULL,
    stage_role public.approvalrole NOT NULL,
    stage_name character varying(255) NOT NULL,
    approver_email character varying(255),
    approver_name character varying(255),
    status public.approvalstatus,
    decision character varying(50),
    comments text,
    feedback json,
    assigned_at timestamp with time zone DEFAULT now(),
    reviewed_at timestamp with time zone,
    sla_deadline timestamp with time zone,
    is_escalated public.escalationflag,
    meta_data json
);


--
-- Name: approval_workflows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.approval_workflows (
    id uuid NOT NULL,
    project_id uuid NOT NULL,
    organisation_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    stages json,
    escalation_enabled public.escalationstatus,
    escalation_sla_hours integer,
    is_active public.workflowstatus,
    meta_data json,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    created_by character varying(255) NOT NULL
);


--
-- Name: group_project_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_project_roles (
    id uuid NOT NULL,
    group_id uuid NOT NULL,
    project_id uuid NOT NULL,
    role_id uuid NOT NULL,
    assigned_at timestamp with time zone DEFAULT now(),
    assigned_by character varying(255) NOT NULL,
    expires_at timestamp with time zone
);


--
-- Name: groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.groups (
    id uuid NOT NULL,
    organisation_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    created_by character varying(255) NOT NULL
);


--
-- Name: organisations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organisations (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    website character varying(500),
    description text,
    logo text,
    owner_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


--
-- Name: password_reset_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_codes (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    email character varying(255) NOT NULL,
    code character varying(6) NOT NULL,
    is_used boolean,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    resource character varying(100) NOT NULL,
    action character varying(100) NOT NULL,
    description text,
    is_system_permission boolean,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: project_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_roles (
    id uuid NOT NULL,
    organisation_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    role_type character varying(100) NOT NULL,
    description text,
    is_system_role boolean,
    is_active boolean,
    meta_data json,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    created_by character varying(255) NOT NULL
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    status public.projectstatus,
    owner_id uuid NOT NULL,
    organisation_id uuid NOT NULL,
    team_ids json,
    settings json,
    ai_context json,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    id uuid NOT NULL,
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    assigned_at timestamp with time zone DEFAULT now(),
    assigned_by character varying(255)
);


--
-- Name: test_cases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_cases (
    id uuid NOT NULL,
    project_id uuid NOT NULL,
    test_suite_id uuid,
    title character varying(500) NOT NULL,
    description text,
    steps json,
    expected_result text,
    actual_result text,
    status public.testcasestatus,
    priority public.testcasepriority,
    ai_generated boolean,
    generated_by public.generationtype,
    confidence_score character varying(50),
    execution_logs json,
    tags json,
    attachments json,
    meta_data json,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    created_by character varying(255) NOT NULL,
    assigned_to character varying(255)
);


--
-- Name: test_plan_approvals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_plan_approvals (
    id uuid NOT NULL,
    test_plan_id uuid NOT NULL,
    workflow_id uuid,
    overall_status public.approvalstatus,
    current_stage integer,
    submitted_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone
);


--
-- Name: test_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_plans (
    id uuid NOT NULL,
    project_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    objectives json,
    generated_by public.generationtype,
    source_documents json,
    confidence_score character varying(50),
    tags json,
    meta_data json,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    created_by character varying(255) NOT NULL
);


--
-- Name: test_suites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_suites (
    id uuid NOT NULL,
    project_id uuid NOT NULL,
    test_plan_id uuid,
    name character varying(255) NOT NULL,
    description text,
    generated_by public.generationtype,
    execution_history json,
    tags json,
    meta_data json,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    created_by character varying(255) NOT NULL
);


--
-- Name: user_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_groups (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    group_id uuid NOT NULL,
    added_at timestamp with time zone DEFAULT now(),
    added_by character varying(255)
);


--
-- Name: user_project_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_project_roles (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    project_id uuid NOT NULL,
    role_id uuid NOT NULL,
    assigned_at timestamp with time zone DEFAULT now(),
    assigned_by character varying(255) NOT NULL,
    expires_at timestamp with time zone
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email character varying(255) NOT NULL,
    username character varying(100) NOT NULL,
    full_name character varying(255),
    hashed_password character varying(255) NOT NULL,
    is_active boolean,
    is_superuser boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Data for Name: approval_history; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: approval_stages; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: approval_workflows; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: group_project_roles; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: organisations; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: password_reset_codes; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: project_roles; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: test_cases; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: test_plan_approvals; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: test_plans; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: test_suites; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: user_groups; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: user_project_roles; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Name: approval_history approval_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_history
    ADD CONSTRAINT approval_history_pkey PRIMARY KEY (id);


--
-- Name: approval_stages approval_stages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_stages
    ADD CONSTRAINT approval_stages_pkey PRIMARY KEY (id);


--
-- Name: approval_workflows approval_workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_workflows
    ADD CONSTRAINT approval_workflows_pkey PRIMARY KEY (id);


--
-- Name: group_project_roles group_project_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_project_roles
    ADD CONSTRAINT group_project_roles_pkey PRIMARY KEY (id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: organisations organisations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organisations
    ADD CONSTRAINT organisations_pkey PRIMARY KEY (id);


--
-- Name: password_reset_codes password_reset_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_codes
    ADD CONSTRAINT password_reset_codes_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key UNIQUE (name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: project_roles project_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_roles
    ADD CONSTRAINT project_roles_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: test_cases test_cases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_cases
    ADD CONSTRAINT test_cases_pkey PRIMARY KEY (id);


--
-- Name: test_plan_approvals test_plan_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_plan_approvals
    ADD CONSTRAINT test_plan_approvals_pkey PRIMARY KEY (id);


--
-- Name: test_plan_approvals test_plan_approvals_test_plan_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_plan_approvals
    ADD CONSTRAINT test_plan_approvals_test_plan_id_key UNIQUE (test_plan_id);


--
-- Name: test_plans test_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_plans
    ADD CONSTRAINT test_plans_pkey PRIMARY KEY (id);


--
-- Name: test_suites test_suites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_suites
    ADD CONSTRAINT test_suites_pkey PRIMARY KEY (id);


--
-- Name: user_groups user_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT user_groups_pkey PRIMARY KEY (id);


--
-- Name: user_project_roles user_project_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_project_roles
    ADD CONSTRAINT user_project_roles_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_organisations_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_organisations_name ON public.organisations USING btree (name);


--
-- Name: ix_organisations_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_organisations_owner_id ON public.organisations USING btree (owner_id);


--
-- Name: ix_password_reset_codes_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_password_reset_codes_email ON public.password_reset_codes USING btree (email);


--
-- Name: ix_password_reset_codes_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_password_reset_codes_id ON public.password_reset_codes USING btree (id);


--
-- Name: ix_password_reset_codes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_password_reset_codes_user_id ON public.password_reset_codes USING btree (user_id);


--
-- Name: ix_projects_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_projects_name ON public.projects USING btree (name);


--
-- Name: ix_projects_organisation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_projects_organisation_id ON public.projects USING btree (organisation_id);


--
-- Name: ix_projects_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_projects_owner_id ON public.projects USING btree (owner_id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


--
-- Name: approval_history approval_history_approval_stage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_history
    ADD CONSTRAINT approval_history_approval_stage_id_fkey FOREIGN KEY (approval_stage_id) REFERENCES public.approval_stages(id) ON DELETE SET NULL;


--
-- Name: approval_history approval_history_test_plan_approval_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_history
    ADD CONSTRAINT approval_history_test_plan_approval_id_fkey FOREIGN KEY (test_plan_approval_id) REFERENCES public.test_plan_approvals(id) ON DELETE CASCADE;


--
-- Name: approval_stages approval_stages_test_plan_approval_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_stages
    ADD CONSTRAINT approval_stages_test_plan_approval_id_fkey FOREIGN KEY (test_plan_approval_id) REFERENCES public.test_plan_approvals(id) ON DELETE CASCADE;


--
-- Name: approval_workflows approval_workflows_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_workflows
    ADD CONSTRAINT approval_workflows_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: approval_workflows approval_workflows_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_workflows
    ADD CONSTRAINT approval_workflows_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: group_project_roles group_project_roles_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_project_roles
    ADD CONSTRAINT group_project_roles_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: group_project_roles group_project_roles_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_project_roles
    ADD CONSTRAINT group_project_roles_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: group_project_roles group_project_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_project_roles
    ADD CONSTRAINT group_project_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.project_roles(id) ON DELETE CASCADE;


--
-- Name: groups groups_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: organisations organisations_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organisations
    ADD CONSTRAINT organisations_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: project_roles project_roles_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_roles
    ADD CONSTRAINT project_roles_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: projects projects_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id);


--
-- Name: projects projects_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.project_roles(id) ON DELETE CASCADE;


--
-- Name: test_cases test_cases_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_cases
    ADD CONSTRAINT test_cases_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: test_cases test_cases_test_suite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_cases
    ADD CONSTRAINT test_cases_test_suite_id_fkey FOREIGN KEY (test_suite_id) REFERENCES public.test_suites(id) ON DELETE CASCADE;


--
-- Name: test_plan_approvals test_plan_approvals_test_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_plan_approvals
    ADD CONSTRAINT test_plan_approvals_test_plan_id_fkey FOREIGN KEY (test_plan_id) REFERENCES public.test_plans(id) ON DELETE CASCADE;


--
-- Name: test_plan_approvals test_plan_approvals_workflow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_plan_approvals
    ADD CONSTRAINT test_plan_approvals_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.approval_workflows(id) ON DELETE SET NULL;


--
-- Name: test_plans test_plans_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_plans
    ADD CONSTRAINT test_plans_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: test_suites test_suites_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_suites
    ADD CONSTRAINT test_suites_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: test_suites test_suites_test_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_suites
    ADD CONSTRAINT test_suites_test_plan_id_fkey FOREIGN KEY (test_plan_id) REFERENCES public.test_plans(id) ON DELETE CASCADE;


--
-- Name: user_groups user_groups_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT user_groups_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: user_groups user_groups_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT user_groups_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_project_roles user_project_roles_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_project_roles
    ADD CONSTRAINT user_project_roles_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: user_project_roles user_project_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_project_roles
    ADD CONSTRAINT user_project_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.project_roles(id) ON DELETE CASCADE;


--
-- Name: user_project_roles user_project_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_project_roles
    ADD CONSTRAINT user_project_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict cP6Ajma0PVLX3EKOaAOmaoTjKt7CQaAMUKls490MK7ebXxHqt2X1zQt4uMijh4P

