import { makeAsyncResultFunc, makeSuccess, type PR } from 'freedom-async';
import type { EmailUserId } from 'freedom-email-api';

import { dbQuery } from '../../db/postgresClient.ts';

export const deleteUser = makeAsyncResultFunc([import.meta.filename, 'deleteUser'], async (_trace, userId: EmailUserId): PR<undefined> => {
  // Delete the user from the PostgreSQL database
  await dbQuery('DELETE FROM users WHERE "userId" = $1', [userId]);

  // Do not implement, until any calling code starts caring about the fact of the preceding existence of the record
  // if (deleteResult.rowCount === 0) {
  //   return makeFailure(
  //     new NotFoundError(trace, {
  //       errorCode: 'not-found',
  //       message: `User not found: ${userId}`
  //     })
  //   );
  // }

  return makeSuccess(undefined);
});
