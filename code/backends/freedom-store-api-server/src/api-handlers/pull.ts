import { makeFailure, makeSuccess } from 'freedom-async';
import { InputSchemaValidationError } from 'freedom-common-errors';
import { getUserById } from 'freedom-db';
import { getEmailAgentSyncableStore } from 'freedom-email-server';
import { emailUserIdInfo } from 'freedom-email-sync';
import { pullFromLocal } from 'freedom-local-sync';
import type { InferHttpApiHandlerResultTypeFromApi } from 'freedom-server-api-handling';
import { makeHttpApiHandler } from 'freedom-server-api-handling';
import { api } from 'freedom-store-api-server-api';
import { DEFAULT_SALT_ID, storageRootIdInfo } from 'freedom-sync-types';

export default makeHttpApiHandler(
  [import.meta.filename],
  { api: api.pull.POST, deepDisableLam: 'not-found' },
  async (
    trace,
    {
      input: {
        body: { basePath, localHashesRelativeToBasePath, glob, sendData = false }
      }
    }
  ): Promise<InferHttpApiHandlerResultTypeFromApi<typeof api.pull.POST>> => {
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
      storageRootId: storageRootId,
      creatorPublicKeys: creatorUser.value.publicKeys,
      saltsById: { [DEFAULT_SALT_ID]: creatorUser.value.defaultSalt }
    });
    if (!syncableStore.ok) {
      return syncableStore;
    }

    const userFs = syncableStore.value;

    const pulled = await pullFromLocal(trace, userFs, { basePath, localHashesRelativeToBasePath, glob, sendData });
    if (!pulled.ok) {
      return pulled;
    }

    return makeSuccess({ body: pulled.value });
  }
);
