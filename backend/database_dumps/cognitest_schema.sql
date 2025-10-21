--
-- PostgreSQL database dump
--

-- Dumped from database version 15.12 (Homebrew)
-- Dumped by pg_dump version 15.12 (Homebrew)

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
-- Name: generationtype; Type: TYPE; Schema: public; Owner: akash
--

CREATE TYPE public.generationtype AS ENUM (
    'AI',
    'MANUAL',
    'HYBRID'
);


ALTER TYPE public.generationtype OWNER TO akash;

--
-- Name: projectstatus; Type: TYPE; Schema: public; Owner: akash
--

CREATE TYPE public.projectstatus AS ENUM (
    'ACTIVE',
    'ARCHIVED',
    'PAUSED'
);


ALTER TYPE public.projectstatus OWNER TO akash;

--
-- Name: testcasepriority; Type: TYPE; Schema: public; Owner: akash
--

CREATE TYPE public.testcasepriority AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


ALTER TYPE public.testcasepriority OWNER TO akash;

--
-- Name: testcasestatus; Type: TYPE; Schema: public; Owner: akash
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


ALTER TYPE public.testcasestatus OWNER TO akash;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: organisations; Type: TABLE; Schema: public; Owner: akash
--

CREATE TABLE public.organisations (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    website character varying(500),
    description text,
    owner_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.organisations OWNER TO akash;

--
-- Name: projects; Type: TABLE; Schema: public; Owner: akash
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


ALTER TABLE public.projects OWNER TO akash;

--
-- Name: test_cases; Type: TABLE; Schema: public; Owner: akash
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


ALTER TABLE public.test_cases OWNER TO akash;

--
-- Name: test_plans; Type: TABLE; Schema: public; Owner: akash
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


ALTER TABLE public.test_plans OWNER TO akash;

--
-- Name: test_suites; Type: TABLE; Schema: public; Owner: akash
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


ALTER TABLE public.test_suites OWNER TO akash;

--
-- Name: users; Type: TABLE; Schema: public; Owner: akash
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


ALTER TABLE public.users OWNER TO akash;

--
-- Data for Name: organisations; Type: TABLE DATA; Schema: public; Owner: akash
--

COPY public.organisations (id, name, website, description, owner_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: akash
--

COPY public.projects (id, name, description, status, owner_id, organisation_id, team_ids, settings, ai_context, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: test_cases; Type: TABLE DATA; Schema: public; Owner: akash
--

COPY public.test_cases (id, project_id, test_suite_id, title, description, steps, expected_result, actual_result, status, priority, ai_generated, generated_by, confidence_score, execution_logs, tags, attachments, meta_data, created_at, updated_at, created_by, assigned_to) FROM stdin;
\.


--
-- Data for Name: test_plans; Type: TABLE DATA; Schema: public; Owner: akash
--

COPY public.test_plans (id, project_id, name, description, objectives, generated_by, source_documents, confidence_score, tags, meta_data, created_at, updated_at, created_by) FROM stdin;
\.


--
-- Data for Name: test_suites; Type: TABLE DATA; Schema: public; Owner: akash
--

COPY public.test_suites (id, project_id, test_plan_id, name, description, generated_by, execution_history, tags, meta_data, created_at, updated_at, created_by) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: akash
--

COPY public.users (id, email, username, full_name, hashed_password, is_active, is_superuser, created_at, updated_at) FROM stdin;
\.


--
-- Name: organisations organisations_pkey; Type: CONSTRAINT; Schema: public; Owner: akash
--

ALTER TABLE ONLY public.organisations
    ADD CONSTRAINT organisations_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: akash
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: test_cases test_cases_pkey; Type: CONSTRAINT; Schema: public; Owner: akash
--

ALTER TABLE ONLY public.test_cases
    ADD CONSTRAINT test_cases_pkey PRIMARY KEY (id);


--
-- Name: test_plans test_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: akash
--

ALTER TABLE ONLY public.test_plans
    ADD CONSTRAINT test_plans_pkey PRIMARY KEY (id);


--
-- Name: test_suites test_suites_pkey; Type: CONSTRAINT; Schema: public; Owner: akash
--

ALTER TABLE ONLY public.test_suites
    ADD CONSTRAINT test_suites_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: akash
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_organisations_name; Type: INDEX; Schema: public; Owner: akash
--

CREATE INDEX ix_organisations_name ON public.organisations USING btree (name);


--
-- Name: ix_organisations_owner_id; Type: INDEX; Schema: public; Owner: akash
--

CREATE INDEX ix_organisations_owner_id ON public.organisations USING btree (owner_id);


--
-- Name: ix_projects_name; Type: INDEX; Schema: public; Owner: akash
--

CREATE INDEX ix_projects_name ON public.projects USING btree (name);


--
-- Name: ix_projects_organisation_id; Type: INDEX; Schema: public; Owner: akash
--

CREATE INDEX ix_projects_organisation_id ON public.projects USING btree (organisation_id);


--
-- Name: ix_projects_owner_id; Type: INDEX; Schema: public; Owner: akash
--

CREATE INDEX ix_projects_owner_id ON public.projects USING btree (owner_id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: akash
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: akash
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: akash
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


--
-- Name: organisations organisations_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: akash
--

ALTER TABLE ONLY public.organisations
    ADD CONSTRAINT organisations_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: projects projects_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: akash
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id);


--
-- Name: projects projects_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: akash
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: test_cases test_cases_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: akash
--

ALTER TABLE ONLY public.test_cases
    ADD CONSTRAINT test_cases_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: test_cases test_cases_test_suite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: akash
--

ALTER TABLE ONLY public.test_cases
    ADD CONSTRAINT test_cases_test_suite_id_fkey FOREIGN KEY (test_suite_id) REFERENCES public.test_suites(id) ON DELETE CASCADE;


--
-- Name: test_plans test_plans_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: akash
--

ALTER TABLE ONLY public.test_plans
    ADD CONSTRAINT test_plans_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: test_suites test_suites_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: akash
--

ALTER TABLE ONLY public.test_suites
    ADD CONSTRAINT test_suites_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: test_suites test_suites_test_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: akash
--

ALTER TABLE ONLY public.test_suites
    ADD CONSTRAINT test_suites_test_plan_id_fkey FOREIGN KEY (test_plan_id) REFERENCES public.test_plans(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

