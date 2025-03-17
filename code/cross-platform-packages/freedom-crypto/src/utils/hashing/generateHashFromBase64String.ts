import type { PR } from 'freedom-async';
import type { Base64String } from 'freedom-basic-data';
import { base64String } from 'freedom-basic-data';
import type { Trace } from 'freedom-contexts';
import type { HashingMode } from 'freedom-crypto-data';

import { generateHashFromBuffer } from './generateHashFromBuffer.ts';

export const generateHashFromBase64String = async (
  trace: Trace,
  { mode, value }: { mode?: HashingMode; value: Base64String }
): PR<Uint8Array> => generateHashFromBuffer(trace, { mode, value: base64String.toBuffer(value) });
