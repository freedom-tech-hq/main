import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Base64String, Sha256Hash } from 'freedom-basic-data';
import { base64String, sha256HashInfo } from 'freedom-basic-data';

import { generateHashFromBase64String } from './generateHashFromBase64String.ts';

export const generateSha256HashFromBase64String = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, value: Base64String): PR<Sha256Hash> => {
    const hash = await generateHashFromBase64String(trace, { mode: 'SHA-256', value });
    if (!hash.ok) {
      return hash;
    }

    return makeSuccess(sha256HashInfo.make(base64String.makeWithBuffer(hash.value)));
  }
);
