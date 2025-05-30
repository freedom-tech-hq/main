import type { PR } from 'freedom-async';
import type { Base64String } from 'freedom-basic-data';
import type { Trace } from 'freedom-contexts';
import { encryptValue } from 'freedom-crypto';
import type { CombinationCryptoKeySet } from 'freedom-crypto-data';
import { preferredEncryptionMode } from 'freedom-crypto-data';
import type { Schema } from 'yaschema';

export async function userEncryptValue<T>(
  trace: Trace,
  {
    schema,
    value,
    publicKeys
  }: {
    schema: Schema<T>;
    value: T;
    publicKeys: CombinationCryptoKeySet;
  }
): PR<Base64String> {
  // Inlined generateEncryptedValue()
  const encryptedValue = await encryptValue(trace, {
    mode: preferredEncryptionMode,
    value,
    valueSchema: schema,
    encryptingKeys: publicKeys,
    includeKeyId: true
  });

  return encryptedValue;
}
