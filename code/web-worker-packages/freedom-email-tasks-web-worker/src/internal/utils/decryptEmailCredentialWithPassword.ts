import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { base64String } from 'freedom-basic-data';
import { decryptBufferWithPassword } from 'freedom-crypto';
import type { EmailCredential, EncryptedEmailCredential } from 'freedom-email-api';
import { emailCredentialSchema } from 'freedom-email-api';
import { deserialize } from 'freedom-serialization';
import type { JsonValue } from 'yaschema';

export const decryptEmailCredentialWithPassword = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { encryptedCredential, password }: { encryptedCredential: EncryptedEmailCredential; password: string }
  ): PR<EmailCredential> => {
    const encryptedValue = base64String.toBuffer(encryptedCredential.encrypted);

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
