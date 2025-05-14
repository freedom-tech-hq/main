import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Base64String } from 'freedom-basic-data';
import type { EmailUserId } from 'freedom-email-sync';
import { makeApiFetchTask } from 'freedom-fetching';
import { api } from 'freedom-store-api-server-api';
import { getDefaultApiRoutingContext } from 'yaschema-api';

export interface RetrieveCredentialsResult {
  userId: EmailUserId;
  encryptedCredentials: Base64String | null;
}

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
export const retrieveCredentialsFromServer = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { email }: { email: string }): PR<RetrieveCredentialsResult, 'not-found'> => {
    // Call the retrieve credentials API
    const response = await retrieveCredentialsFromRemote(trace, {
      body: { email },
      context: getDefaultApiRoutingContext()
    });

    if (!response.ok) {
      return response;
    }

    return makeSuccess<RetrieveCredentialsResult>(response.value.body);
  }
);
