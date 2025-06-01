import type { PR } from 'freedom-async';
import type { Base64String } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { decryptValue, extractKeyIdFromEncryptedString } from 'freedom-crypto';
import type { Schema } from 'yaschema';

import type { UserKeys } from '../types/UserKeys.ts';

/*
  The opposite operation is simpler because it does not need to detect the keyId. So use this:

  import { encryptValue } from 'freedom-crypto';

  await encryptValue(trace, {
    valueSchema,
    value,
    encryptingKeys: publicKeys
  });
 */
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

  return await decryptValue(trace, {
    encryptedValue,
    valueSchema: schema,
    decryptingKeys: privateKeysResult.value
  });
}
