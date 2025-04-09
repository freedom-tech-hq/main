import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { type Base64String, base64String } from 'freedom-basic-data';
import { encryptBufferWithPassword } from 'freedom-crypto';
import { serialize } from 'freedom-serialization';

import { type UserAuthPackage, userAuthPackageSchema } from '../types/UserAuthPackage.ts';

export const encryptUserAuthPackageWithPassword = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { userAuthPackage, password }: { userAuthPackage: UserAuthPackage; password: string }): PR<Base64String> => {
    const serializedPackage = await serialize(trace, userAuthPackage, userAuthPackageSchema);
    if (!serializedPackage.ok) {
      return serializedPackage;
    }

    const jsonString = JSON.stringify(serializedPackage.value);
    const encryptedBuffer = await encryptBufferWithPassword(trace, { buffer: Buffer.from(jsonString, 'utf-8'), password });
    if (!encryptedBuffer.ok) {
      return encryptedBuffer;
    }

    return makeSuccess(base64String.makeWithBuffer(encryptedBuffer.value));
  }
);
