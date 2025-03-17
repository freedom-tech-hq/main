import type { PR } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { HashingMode } from 'freedom-crypto-data';

import { generateHashFromBuffer } from './generateHashFromBuffer.ts';

export const generateHashFromString = async (trace: Trace, { mode, value }: { mode?: HashingMode; value: string }): PR<Uint8Array> =>
  generateHashFromBuffer(trace, { mode, value: Buffer.from(value, 'utf-8') });
