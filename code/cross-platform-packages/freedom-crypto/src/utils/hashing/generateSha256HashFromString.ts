import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';

import { generateSha256HashFromBuffer } from './generateSha256HashFromBuffer.ts';

export const generateSha256HashFromString = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, value: string): PR<Sha256Hash> => await generateSha256HashFromBuffer(trace, Buffer.from(value, 'utf-8'))
);
