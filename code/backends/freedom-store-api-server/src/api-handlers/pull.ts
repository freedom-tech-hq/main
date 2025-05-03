import { makeFailure, makeSuccess } from 'freedom-async';
import { InputSchemaValidationError } from 'freedom-common-errors';
import { emailUserIdInfo } from 'freedom-email-sync';
import { makeHttpApiHandler } from 'freedom-server-api-handling';
import { api } from 'freedom-store-api-server-api';
import { storageRootIdInfo } from 'freedom-sync-types';
import { pullPath } from 'freedom-syncable-store';
import { getEmailAccessByUserId } from 'freedom-syncable-store-server';

export default makeHttpApiHandler(
  [import.meta.filename],
  { api: api.pull.POST, disableLam: 'not-found' },
  async (trace, { input: { body: args } }) => {
    const userId = emailUserIdInfo.checked(storageRootIdInfo.removePrefix(args.path.storageRootId));
    if (userId === undefined) {
      return makeFailure(new InputSchemaValidationError(trace, { message: 'Expected a valid EmailUserId' }));
    }

    const access = await getEmailAccessByUserId(trace, { userId });
    if (!access.ok) {
      return access;
    }

    const userFs = access.value.userFs;

    const pulled = await pullPath(trace, userFs, args);
    if (!pulled.ok) {
      return pulled;
    }

    return makeSuccess({ body: pulled.value });
  }
);
