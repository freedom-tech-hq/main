import type { PoolConfig, QueryResult, QueryResultRow } from 'pg';
import { Pool } from 'pg';

import { getConfig } from '../config.ts';

// Configure PostgreSQL client options
const getPostgresConfig = (): PoolConfig => {
  return {
    host: getConfig('PG_HOST'),
    port: getConfig('PG_PORT'),
    database: getConfig('PG_DATABASE'),
    user: getConfig('PG_USER'),
    password: getConfig('PG_PASSWORD'),
    // Enable native bindings if configured
    ...(getConfig('PG_USE_NATIVE') && { native: true })
  };
};

// Create a singleton pool to be reused by the application
let pool: Pool | null = null;

export const getPostgresPool = (): Pool => {
  if (pool === null) {
    const config = getPostgresConfig();
    pool = new Pool(config);

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });
  }

  return pool;
};

export const dbQuery = async <Row extends QueryResultRow = any>(query: string, params: any[] = []): Promise<QueryResult<Row>> => {
  const pool = getPostgresPool();
  return await pool.query(query, params);
};

// Function to close the pool connection (useful for tests and clean shutdowns)
export const closePostgres = async (): Promise<void> => {
  if (pool !== null) {
    await pool.end();
    pool = null;
  }
};
