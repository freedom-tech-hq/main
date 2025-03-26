import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { DecryptingKeySet, EncryptedValue } from 'freedom-crypto-data';

import { decryptValue } from './decryptValue.ts';

export const decryptEncryptedValue = makeAsyncResultFunc(
  [import.meta.filename],
  async <T>(trace: Trace, encryptedValue: EncryptedValue<T>, { decryptingKeys }: { decryptingKeys: DecryptingKeySet }): PR<T> =>
    await decryptValue(trace, {
      encryptedValue: encryptedValue.encryptedValue,
      valueSchema: encryptedValue.decryptedValueSchema,
      decryptingKeys
    })
);
