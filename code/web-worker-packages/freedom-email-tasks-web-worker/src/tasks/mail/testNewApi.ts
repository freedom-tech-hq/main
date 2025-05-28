import { makeFailure, type PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Base64String } from 'freedom-basic-data';
import { generalizeFailureResult, InternalStateError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { decryptEncryptedValue, encryptValue as lowLevelEncryptValue, extractKeyIdFromEncryptedString } from 'freedom-crypto';
import { makeEncryptedValue, preferredEncryptionMode } from 'freedom-crypto-data';
import type { UserKeys } from 'freedom-crypto-service';
import { type DecryptedListMessage, decryptedListMessagePartSchema } from 'freedom-email-user';
import { makeApiFetchTask } from 'freedom-fetching';
import { api } from 'freedom-store-api-server-api';
import type { Schema } from 'yaschema';
import { getDefaultApiRoutingContext } from 'yaschema-api';

import { useActiveCredential } from '../../contexts/active-credential.ts';
import { makeUserKeysFromEmailCredential } from '../../internal/utils/makeUserKeysFromEmailCredential.ts';

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
  // /Access credentials

  // Generate test data
  const encryptedResult = await encryptValue(
    trace,
    userKeys,
    {
      subject: 'Test subject',
      snippet: 'Test body'
    },
    decryptedListMessagePartSchema
  );
  if (!encryptedResult.ok) {
    return encryptedResult;
  }

  console.log('Generated listMessage:', encryptedResult.value);

  // Test scenario
  console.log('Starting testNewApi task...');

  const apiResult = await getMessages(trace, {
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
    // Split
    const { listMessage, ...openFields } = message;

    // Decrypt
    const decryptedPart = await decryptValue(trace, userKeys, listMessage, decryptedListMessagePartSchema);
    if (!decryptedPart.ok) {
      return decryptedPart;
    }

    // Reconstruct
    result.push({
      ...openFields,
      ...decryptedPart.value
    });
  }

  console.log('Successfully fetched messages:', result);

  return makeSuccess(undefined);
});

async function decryptValue<T>(trace: Trace, userKeys: UserKeys, encryptedBase64String: Base64String, schema: Schema<T>): PR<T> {
  const keyIdResult = await extractKeyIdFromEncryptedString(trace, { encryptedValue: encryptedBase64String });
  if (!keyIdResult.ok) {
    return generalizeFailureResult(trace, keyIdResult, 'not-found');
  }

  const privateKeysResult = await userKeys.getPrivateCryptoKeySet(trace, keyIdResult.value);
  if (!privateKeysResult.ok) {
    return generalizeFailureResult(trace, privateKeysResult, 'not-found');
  }

  // TODO: Consider eliminating the EncryptedValue type
  const encryptedValue = makeEncryptedValue({
    decryptedValueSchema: schema,
    encryptedValue: encryptedBase64String
  });
  return await decryptEncryptedValue(trace, encryptedValue, { decryptingKeys: privateKeysResult.value });
}

async function encryptValue<T>(trace: Trace, userKeys: UserKeys, value: T, schema: Schema<T>): PR<Base64String> {
  const privateKeysResult = await userKeys.getPrivateCryptoKeySet(trace);
  if (!privateKeysResult.ok) {
    return generalizeFailureResult(trace, privateKeysResult, 'not-found');
  }

  // Inlined generateEncryptedValue()
  // TODO: Think of naming better not to rename encryptValue() to lowLevelEncryptValue()
  const encryptedValue = await lowLevelEncryptValue(trace, {
    mode: preferredEncryptionMode,
    value,
    valueSchema: schema,
    encryptingKeys: privateKeysResult.value,
    includeKeyId: true
  });

  return encryptedValue;
}
