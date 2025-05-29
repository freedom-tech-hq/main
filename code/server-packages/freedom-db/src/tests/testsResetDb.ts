import { dbQuery } from '../db/postgresClient.ts';

/**
 * Resets the DB to its 'just migrated from scratch' state.
 */
export async function testsResetDb(): Promise<void> {
  await dbQuery('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
}
