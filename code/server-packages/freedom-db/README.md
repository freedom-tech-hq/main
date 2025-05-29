# Freedom DB

A server all-database package:

- Domain model
- DBAL
- Mocks

In the future, could be split into multiple packages.

## How to run locally

1. You need a Postgres server running at the default port.
2. Go to [migrations](migrations) dir.
   2.1. Create databases [2025-05-10_create_databases.sql](migrations/2025-05-10_create_databases.sql) - run manually as `postgres` user.
   2.2. Connect with the newly created user `freedom_user`.
   2.3. Run the rest of SQL migrations manually.
   2.4. Optional: use [migrate-fs-to-sql.cjs](migrations/migrate-fs-to-sql.cjs). It does not update the data, it outputs SQL to run manually.
3. Run the backends with no extra configuration.

## How to apply migrations in the cloud

Docker commands are for the local machine. To use them on the server only drop the `--context freedom-dev` arg.

Find the `db` container name.

```shell
docker --context freedom-dev ps | grep -db-
```

Enter the docker container.

```shell
docker --context freedom-dev exec -it <deployment>-db-1 psql -U freedom_user freedom
```

Run the [migrations](migrations) SQL there.
