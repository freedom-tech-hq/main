import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { type Base64String, base64String } from 'freedom-basic-data';
import { encryptBufferWithPassword } from 'freedom-crypto';
import { serialize } from 'freedom-serialization';

import type { EmailCredential } from '../types/EmailCredential.ts';
import { emailCredentialSchema } from '../types/EmailCredential.ts';

export const encryptEmailCredentialWithPassword = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { credential, password }: { credential: EmailCredential; password: string }): PR<Base64String> => {
    const serializedPackage = await serialize(trace, credential, emailCredentialSchema);
    if (!serializedPackage.ok) {
      return serializedPackage;
    }

    const jsonString = JSON.stringify(serializedPackage.value.serializedValue);
    const encryptedBuffer = await encryptBufferWithPassword(trace, { buffer: Buffer.from(jsonString, 'utf-8'), password });
    if (!encryptedBuffer.ok) {
      return encryptedBuffer;
    }

    return makeSuccess(base64String.makeWithBuffer(encryptedBuffer.value));
  }
);
