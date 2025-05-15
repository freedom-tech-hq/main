import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { EmailCredential } from 'freedom-email-user';
import { makeApiFetchTask } from 'freedom-fetching';
import { api } from 'freedom-store-api-server-api';
import { DEFAULT_SALT_ID } from 'freedom-sync-types';
import { getDefaultApiRoutingContext } from 'yaschema-api';

import { getOrCreateEmailSyncableStore } from './getOrCreateEmailSyncableStore.ts';

const registerWithRemote = makeApiFetchTask([import.meta.filename, 'registerWithRemote'], api.register.POST);

export const reserveEmail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, credential: EmailCredential, { emailUsername }: { emailUsername: string }): PR<undefined, 'email-unavailable'> => {
    const syncableStore = await uncheckedResult(getOrCreateEmailSyncableStore(trace, credential));

    const rootMetadata = await syncableStore.getMetadata(trace);
    if (!rootMetadata.ok) {
      return rootMetadata;
    }

    const result = await registerWithRemote(trace, {
      body: {
        name: emailUsername,
        storageRootId: syncableStore.path.storageRootId,
        metadata: { provenance: rootMetadata.value.provenance },
        creatorPublicKeys: credential.privateKeys.publicOnly(),
        saltsById: { [DEFAULT_SALT_ID]: syncableStore.saltsById[DEFAULT_SALT_ID] }
      },
      context: getDefaultApiRoutingContext()
    });
    if (!result.ok) {
      if (result.value.errorCode === 'already-created') {
        return makeSuccess(undefined);
      }
      return generalizeFailureResult(trace, excludeFailureResult(result, 'already-created'), 'conflict');
    }

    return makeSuccess(undefined);
  }
);
