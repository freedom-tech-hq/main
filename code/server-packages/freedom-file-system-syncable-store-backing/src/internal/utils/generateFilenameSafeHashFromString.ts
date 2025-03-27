import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generateHashFromString } from 'freedom-crypto';

export const generateFilenameSafeHashFromString = makeAsyncResultFunc([import.meta.filename], async (trace, value: string): PR<string> => {
  const hash = await generateHashFromString(trace, { value });
  if (!hash.ok) {
    return hash;
  }

  return makeSuccess(Buffer.from(hash.value).toString('hex'));
});
