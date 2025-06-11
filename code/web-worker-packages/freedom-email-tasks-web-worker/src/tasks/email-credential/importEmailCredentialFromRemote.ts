import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import { makeApiFetchTask } from 'freedom-fetching';
import { api } from 'freedom-store-api-server-api';
import { getDefaultApiRoutingContext } from 'yaschema-api';

import type { LocallyStoredEncryptedEmailCredentialInfo } from '../../types/email-credential/LocallyStoredEncryptedEmailCredentialInfo.ts';
import { importEmailCredential } from './importEmailCredential.ts';

// Create API fetch task for retrieving credentials
const retrieveCredentialFromRemote = makeApiFetchTask([import.meta.filename, 'retrieveCredentialFromRemote'], api.retrieveCredential.POST);

/**
 * Retrieves encrypted user credentials from the server using an email address
 *
 * @returns The user ID and encrypted credentials if available
 */
export const importEmailCredentialFromRemote = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { email }: { email: string }): PR<LocallyStoredEncryptedEmailCredentialInfo, 'not-found'> => {
    const retrieved = await retrieveCredentialFromRemote(trace, {
      body: { email },
      context: getDefaultApiRoutingContext()
    });
    if (!retrieved.ok) {
      return retrieved;
    }

    return await importEmailCredential(trace, { encryptedCredential: retrieved.value.body.encryptedCredential });
  }
);
