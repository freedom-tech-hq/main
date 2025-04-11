import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { type Base64String, base64String } from 'freedom-basic-data';
import { decryptBufferWithPassword } from 'freedom-crypto';
import { deserialize } from 'freedom-serialization';
import type { JsonValue } from 'yaschema';

import { type EmailCredential, emailCredentialSchema } from '../types/EmailCredential.ts';

export const decryptEmailCredentialWithPassword = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { encryptedEmailCredential, password }: { encryptedEmailCredential: Base64String; password: string }
  ): PR<EmailCredential> => {
    const encryptedValue = base64String.toBuffer(encryptedEmailCredential);

    const decryptedBuffer = await decryptBufferWithPassword(trace, { encryptedValue, password });
    if (!decryptedBuffer.ok) {
      return decryptedBuffer;
    }

    const jsonString = Buffer.from(decryptedBuffer.value).toString('utf-8');
    const serializedValue = JSON.parse(jsonString) as JsonValue;

    const deserializedPackage = await deserialize(trace, { serializedValue, valueSchema: emailCredentialSchema });
    if (!deserializedPackage.ok) {
      return deserializedPackage;
    }

    return makeSuccess(deserializedPackage.value);
  }
);
