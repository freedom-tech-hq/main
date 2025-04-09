import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { type Base64String, base64String } from 'freedom-basic-data';
import { decryptBufferWithPassword } from 'freedom-crypto';
import { deserialize } from 'freedom-serialization';
import type { JsonValue } from 'yaschema';

import { type UserAuthPackage, userAuthPackageSchema } from '../types/UserAuthPackage.ts';

export const decryptUserAuthPackageWithPassword = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { encryptedUserAuthPackage, password }: { encryptedUserAuthPackage: Base64String; password: string }
  ): PR<UserAuthPackage> => {
    const encryptedValue = base64String.toBuffer(encryptedUserAuthPackage);

    const decryptedBuffer = await decryptBufferWithPassword(trace, { encryptedValue, password });
    if (!decryptedBuffer.ok) {
      return decryptedBuffer;
    }

    const jsonString = Buffer.from(decryptedBuffer.value).toString('utf-8');
    const serializedValue = JSON.parse(jsonString) as JsonValue;

    const deserializedPackage = await deserialize(trace, { serializedValue, valueSchema: userAuthPackageSchema });
    if (!deserializedPackage.ok) {
      return deserializedPackage;
    }

    return makeSuccess(deserializedPackage.value);
  }
);
