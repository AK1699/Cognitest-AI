--
-- PostgreSQL database cluster dump
--

\restrict E5LpakpmbCUqFJaQnFFirC3JGdHhlx7XcqFVX7c347dLkfZSt6W8iEk7Gq3Clxp

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE akash;
ALTER ROLE akash WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS;
CREATE ROLE postgres;
ALTER ROLE postgres WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN NOREPLICATION NOBYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:Pp516Y8ajpfAdddiHgg3KQ==$kjiv/di2yUkYT+a+UYkWZr4GW34XYzVOkPR1QWdvQos=:6trad/HPqjNxyQDC5BN/nxCK+5dQNiNMvJGKQ/5dWI8=';




\unrestrict E5LpakpmbCUqFJaQnFFirC3JGdHhlx7XcqFVX7c347dLkfZSt6W8iEk7Gq3Clxp

--
-- PostgreSQL database cluster dump complete
--

