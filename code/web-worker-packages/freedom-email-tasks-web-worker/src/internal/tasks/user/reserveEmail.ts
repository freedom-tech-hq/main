import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { EmailCredential } from 'freedom-email-api';
import { makeApiFetchTask } from 'freedom-fetching';
import { api } from 'freedom-store-api-server-api';
import { storageRootIdInfo } from 'freedom-sync-types';
import { getDefaultApiRoutingContext } from 'yaschema-api';

const registerWithRemote = makeApiFetchTask([import.meta.filename, 'registerWithRemote'], api.register.POST);

export const reserveEmail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, credential: EmailCredential, { emailUsername }: { emailUsername: string }): PR<undefined, 'email-unavailable'> => {
    const storageRootId = storageRootIdInfo.make(credential.userId);
    const result = await registerWithRemote(trace, {
      body: {
        name: emailUsername,
        storageRootId,
        creatorPublicKeys: credential.privateKeys.publicOnly()
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
