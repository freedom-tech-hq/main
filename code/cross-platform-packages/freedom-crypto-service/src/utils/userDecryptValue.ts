import type { PR } from 'freedom-async';
import type { Base64String } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { decryptEncryptedValue, extractKeyIdFromEncryptedString } from 'freedom-crypto';
import { makeEncryptedValue } from 'freedom-crypto-data';
import type { Schema } from 'yaschema';

import type { UserKeys } from '../types/UserKeys.ts';

export async function userDecryptValue<T>(
  trace: Trace,
  {
    schema,
    encryptedValue,
    userKeys
  }: {
    schema: Schema<T>;
    encryptedValue: Base64String;
    userKeys: UserKeys;
  }
): PR<T> {
  const keyIdResult = await extractKeyIdFromEncryptedString(trace, { encryptedValue });
  if (!keyIdResult.ok) {
    return generalizeFailureResult(trace, keyIdResult, 'not-found');
  }

  const privateKeysResult = await userKeys.getPrivateCryptoKeySet(trace, keyIdResult.value);
  if (!privateKeysResult.ok) {
    return generalizeFailureResult(trace, privateKeysResult, 'not-found');
  }

  // TODO: Consider eliminating the EncryptedValue type
  const packed = makeEncryptedValue({
    decryptedValueSchema: schema,
    encryptedValue
  });
  return await decryptEncryptedValue(trace, packed, { decryptingKeys: privateKeysResult.value });
}
