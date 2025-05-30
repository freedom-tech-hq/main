import type { PR } from 'freedom-async';
import type { Base64String } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { encryptValue } from 'freedom-crypto';
import { preferredEncryptionMode } from 'freedom-crypto-data';
import type { Schema } from 'yaschema';

import type { UserKeys } from '../types/UserKeys.ts';

export async function userEncryptValue<T>(
  trace: Trace,
  {
    schema,
    value,
    userKeys
  }: {
    schema: Schema<T>;
    value: T;
    userKeys: UserKeys;
  }
): PR<Base64String> {
  const privateKeysResult = await userKeys.getPrivateCryptoKeySet(trace);
  if (!privateKeysResult.ok) {
    return generalizeFailureResult(trace, privateKeysResult, 'not-found');
  }

  // Inlined generateEncryptedValue()
  const encryptedValue = await encryptValue(trace, {
    mode: preferredEncryptionMode,
    value,
    valueSchema: schema,
    encryptingKeys: privateKeysResult.value,
    includeKeyId: true
  });

  return encryptedValue;
}
