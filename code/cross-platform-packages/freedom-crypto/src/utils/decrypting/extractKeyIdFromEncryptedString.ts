import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Base64String } from 'freedom-basic-data';
import { base64String } from 'freedom-basic-data';
import type { CryptoKeySetId } from 'freedom-crypto-data';

import { extractKeyIdFromEncryptedBuffer } from './extractKeyIdFromEncryptedBuffer.ts';

export const extractKeyIdFromEncryptedString = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { encryptedValue }: { encryptedValue: Base64String }): PR<CryptoKeySetId, 'not-found'> =>
    extractKeyIdFromEncryptedBuffer(trace, { encryptedValue: base64String.toBuffer(encryptedValue) })
);
