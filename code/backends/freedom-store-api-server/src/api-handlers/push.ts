import { makeFailure, makeSuccess } from 'freedom-async';
import { InputSchemaValidationError } from 'freedom-common-errors';
import { getUserById } from 'freedom-db';
import { getEmailAgentSyncableStore } from 'freedom-email-server';
import { emailUserIdInfo } from 'freedom-email-sync';
import { pushToLocal } from 'freedom-local-sync';
import type { InferHttpApiHandlerResultTypeFromApi } from 'freedom-server-api-handling';
import { makeHttpApiHandler } from 'freedom-server-api-handling';
import { api } from 'freedom-store-api-server-api';
import { DEFAULT_SALT_ID, storageRootIdInfo } from 'freedom-sync-types';

export default makeHttpApiHandler(
  [import.meta.filename],
  { api: api.push.POST, deepDisableLam: 'not-found' },
  async (
    trace,
    {
      input: {
        body: { basePath, item }
      }
    }
  ): Promise<InferHttpApiHandlerResultTypeFromApi<typeof api.push.POST>> => {
    const storageRootId = basePath.storageRootId;

    // TODO: this isn't really how this should work.  The creator public keys and salts by ID should really be referenced directly by
    // storageRootId and having a registered user shouldn't generally be required -- though for the email app it will be, this won't be the
    // model for push/pull in other Freedom apps necessarily.
    const creatorUserId = emailUserIdInfo.checked(storageRootIdInfo.removePrefix(storageRootId));
    if (creatorUserId === undefined) {
      return makeFailure(new InputSchemaValidationError(trace, { message: 'Expected a valid EmailUserId' }));
    }

    const creatorUser = await getUserById(trace, creatorUserId);
    if (!creatorUser.ok) {
      return creatorUser;
    }

    const syncableStore = await getEmailAgentSyncableStore(trace, {
      storageRootId,
      creatorPublicKeys: creatorUser.value.publicKeys,
      saltsById: { [DEFAULT_SALT_ID]: creatorUser.value.defaultSalt }
    });
    if (!syncableStore.ok) {
      return syncableStore;
    }

    const userFs = syncableStore.value;

    const pushed = await pushToLocal(trace, userFs, { basePath, item });
    if (!pushed.ok) {
      return pushed;
    }

    return makeSuccess({});
  }
);
