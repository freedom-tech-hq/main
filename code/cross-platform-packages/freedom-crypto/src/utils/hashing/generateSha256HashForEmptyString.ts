import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';

import { generateSha256HashFromString } from './generateSha256HashFromString.ts';

let globalCache: Sha256Hash | undefined;

export const generateSha256HashForEmptyString = makeAsyncResultFunc([import.meta.filename], async (trace): PR<Sha256Hash> => {
  if (globalCache !== undefined) {
    return makeSuccess(globalCache);
  }

  const hash = await generateSha256HashFromString(trace, '');
  if (!hash.ok) {
    return hash;
  }

  globalCache = hash.value;

  return makeSuccess(globalCache);
});
