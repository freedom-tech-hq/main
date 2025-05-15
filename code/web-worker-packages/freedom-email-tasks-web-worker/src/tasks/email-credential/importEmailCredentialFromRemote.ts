import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Uuid } from 'freedom-contexts';
import { makeApiFetchTask } from 'freedom-fetching';
import { api } from 'freedom-store-api-server-api';
import { getDefaultApiRoutingContext } from 'yaschema-api';

import { importEmailCredential } from './importEmailCredential.ts';

// Create API fetch task for retrieving credentials
const retrieveCredentialsFromRemote = makeApiFetchTask(
  [import.meta.filename, 'retrieveCredentialsFromRemote'],
  api.retrieveCredentials.POST
);

/**
 * Retrieves encrypted user credentials from the server using an email address
 *
 * @returns The user ID and encrypted credentials if available
 */
export const importEmailCredentialFromRemote = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { email }: { email: string }): PR<{ locallyStoredCredentialUuid: Uuid }, 'not-found'> => {
    const retrieved = await retrieveCredentialsFromRemote(trace, {
      body: { email },
      context: getDefaultApiRoutingContext()
    });
    if (!retrieved.ok) {
      return retrieved;
    }

    // TODO: if there's already once with the same name, replace it
    return await importEmailCredential(trace, {
      description: email,
      encryptedEmailCredential: retrieved.value.body.encryptedCredentials
    });
  }
);
