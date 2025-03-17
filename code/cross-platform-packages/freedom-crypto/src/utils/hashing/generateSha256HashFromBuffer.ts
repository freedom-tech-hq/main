import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { base64String, sha256HashInfo } from 'freedom-basic-data';

import { generateHashFromBuffer } from './generateHashFromBuffer.ts';

export const generateSha256HashFromBuffer = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, value: Uint8Array): PR<Sha256Hash> => {
    const hash = await generateHashFromBuffer(trace, { mode: 'SHA-256', value });
    if (!hash.ok) {
      return hash;
    }

    return makeSuccess(sha256HashInfo.make(base64String.makeWithBuffer(hash.value)));
  }
);
