import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { EncryptedValue, EncryptingKeySet, EncryptionMode } from 'freedom-crypto-data';
import { makeEncryptedValue, preferredEncryptionMode } from 'freedom-crypto-data';
import type { Schema } from 'yaschema';

import { encryptValue } from './encryptValue.ts';

export const generateEncryptedValue = makeAsyncResultFunc(
  [import.meta.filename],
  async <T>(
    trace: Trace,
    {
      mode = preferredEncryptionMode,
      value,
      valueSchema,
      encryptingKeys,
      includeKeyId = true
    }: { mode?: EncryptionMode; value: T; valueSchema: Schema<T>; encryptingKeys: EncryptingKeySet; includeKeyId?: boolean }
  ): PR<EncryptedValue<T>> => {
    const encryptedValue = await encryptValue(trace, { mode, value, valueSchema, encryptingKeys, includeKeyId });
    if (!encryptedValue.ok) {
      return encryptedValue;
    }

    return makeSuccess(makeEncryptedValue({ decryptedValueSchema: valueSchema, encryptedValue: encryptedValue.value }));
  }
);
