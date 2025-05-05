import { makeFailure, makeSuccess } from 'freedom-async';
import { InputSchemaValidationError } from 'freedom-common-errors';
import { getUserById } from 'freedom-db';
import { getEmailAgentSyncableStore } from 'freedom-email-server';
import { emailUserIdInfo } from 'freedom-email-sync';
import { makeHttpApiHandler } from 'freedom-server-api-handling';
import { api } from 'freedom-store-api-server-api';
import { storageRootIdInfo } from 'freedom-sync-types';
import { pushPath } from 'freedom-syncable-store';

export default makeHttpApiHandler(
  [import.meta.filename],
  { api: api.push.POST, disableLam: 'not-found' },
  async (trace, { input: { body: args } }) => {
    const userId = emailUserIdInfo.checked(storageRootIdInfo.removePrefix(args.path.storageRootId));
    if (userId === undefined) {
      return makeFailure(new InputSchemaValidationError(trace, { message: 'Expected a valid EmailUserId' }));
    }

    const userResult = await getUserById(trace, userId);
    if (!userResult.ok) {
      return userResult;
    }

    const syncableStoreResult = await getEmailAgentSyncableStore(trace, userResult.value);
    if (!syncableStoreResult.ok) {
      return syncableStoreResult;
    }

    const pushed = await pushPath(trace, syncableStoreResult.value, args);
    if (!pushed.ok) {
      return pushed;
    }

    return makeSuccess({});
  }
);
