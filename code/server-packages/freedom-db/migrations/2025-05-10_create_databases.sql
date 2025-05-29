-- This is the local setup. Cloud envs are set by the deployment scripts.

-- Unified local credentials
CREATE USER freedom_user WITH PASSWORD 'local-password';

-- Persistent DB for manual testing
CREATE DATABASE freedom WITH OWNER = freedom_user;

-- A set of databases for tests
-- In the future, it will create these automatically, according to parallelism.
-- Parallelism is not implemented yet, so creating one manually.
CREATE DATABASE freedom_1 WITH OWNER = freedom_user;
