import { makeFailure, type PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { InternalStateError } from 'freedom-common-errors';
import { userEncryptValue } from 'freedom-crypto-service';
import { type DecryptedListMessage, decryptedListMessagePartSchema } from 'freedom-email-sync';
import { makeApiFetchTask } from 'freedom-fetching';
import { api } from 'freedom-store-api-server-api';
import { getDefaultApiRoutingContext } from 'yaschema-api';

import { useActiveCredential } from '../../contexts/active-credential.ts';
import { makeUserKeysFromEmailCredential } from '../../internal/utils/makeUserKeysFromEmailCredential.ts';
import { decryptListMessage } from './decryptListMessage.ts';

/**
 * Test task that calls the mail messages API endpoint and logs the results
 * This is a demonstration of directly calling an API endpoint from a task
 */
const getMessages = makeApiFetchTask([import.meta.filename, 'getMessages'], api.mail.messages.GET);

export const testNewApi = makeAsyncResultFunc([import.meta.filename], async (trace): PR<undefined> => {
  // Access credentials
  const credential = useActiveCredential(trace).credential;

  if (credential === undefined) {
    return makeFailure(new InternalStateError(trace, { message: 'No active user' }));
  }

  const userKeys = makeUserKeysFromEmailCredential(credential);
  const publicKeys = credential.privateKeys.publicOnly();
  // /Access credentials

  // Generate test data
  const encryptedResult = await userEncryptValue(trace, {
    schema: decryptedListMessagePartSchema,
    value: {
      subject: 'Test subject',
      from: { address: 'someone@me.com' },
      snippet: 'Test body'
    },
    publicKeys
  });
  if (!encryptedResult.ok) {
    return encryptedResult;
  }

  console.log('Generated listFields:', encryptedResult.value);

  // Test scenario
  console.log('Starting testNewApi task...');

  const apiResult = await getMessages(trace, {
    headers: {
      // TODO: Use signed JWT
      authorization: `Bearer ${credential.userId}`
    },
    query: {
      pageToken: undefined
    },
    context: getDefaultApiRoutingContext()
  });

  if (!apiResult.ok) {
    console.log('Error fetching messages:', apiResult.value);
    return apiResult;
  }

  // Decrypt messages
  const result: DecryptedListMessage[] = [];
  for (const message of apiResult.value.body.items) {
    const decryptedMessageResult = await decryptListMessage(trace, userKeys, message);
    if (!decryptedMessageResult.ok) {
      console.log('Error decrypting message', message.id, decryptedMessageResult.value);
      continue;
    }

    result.push(decryptedMessageResult.value);
  }

  console.log('Successfully fetched messages:', result);

  return makeSuccess(undefined);
});
