import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { base64String } from 'freedom-basic-data';
import { encryptBufferWithPassword } from 'freedom-crypto';
import type { EncryptedEmailCredential } from 'freedom-email-sync';
import { serialize } from 'freedom-serialization';

import type { EmailCredential } from '../types/EmailCredential.ts';
import { emailCredentialSchema } from '../types/EmailCredential.ts';

export const encryptEmailCredentialWithPassword = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { email, credential, password }: { email: string; credential: EmailCredential; password: string }
  ): PR<EncryptedEmailCredential> => {
    const serializedPackage = await serialize(trace, credential, emailCredentialSchema);
    if (!serializedPackage.ok) {
      return serializedPackage;
    }

    const jsonString = JSON.stringify(serializedPackage.value.serializedValue);
    const encryptedBuffer = await encryptBufferWithPassword(trace, { buffer: Buffer.from(jsonString, 'utf-8'), password });
    if (!encryptedBuffer.ok) {
      return encryptedBuffer;
    }

    return makeSuccess({
      email,
      encrypted: base64String.makeWithBuffer(encryptedBuffer.value)
    });
  }
);
