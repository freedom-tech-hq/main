import { makeFailure, makeSuccess, type PR } from 'freedom-async';
import { InternalSchemaValidationError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';

import { type User, userSchema } from '../../types/User.ts';

// Note from Pavel: we need an additional user type because of the schema with serialization.
// The very existence of non-serializable in-memory data formats amplifies code complexity.
export interface RawUser {
  userId: string;
  email: string;
  publicKeys: unknown; // JSON with schema
  defaultSalt: string;
  encryptedCredentials: string | null; // Convert to undefined on read
}

export async function getRawUserFromUser(trace: Trace, user: User): PR<RawUser> {
  const serialization = await userSchema.serializeAsync(user);

  if (serialization.error !== undefined) {
    return makeFailure(
      new InternalSchemaValidationError(trace, {
        // Uncomment when needed. Now assuming that the data comes already validated // errorCode: 'validation-error',
        message: `Incorrect user data: ${serialization.error}`
      })
    );
  }

  // TODO: Study typing problem for serializing
  const rawUser = serialization.serialized as unknown as RawUser;
  rawUser.encryptedCredentials = rawUser.encryptedCredentials ?? null;

  return makeSuccess(rawUser);
}

export async function getUserFromRawUser(trace: Trace, rawUser: RawUser): PR<User> {
  const deserialization = await userSchema.deserializeAsync(rawUser);

  if (deserialization.error !== undefined) {
    return makeFailure(
      new InternalSchemaValidationError(trace, {
        // No custom code, because RawUser is from the internal source. // errorCode: 'validation-error',
        message: `Incorrect user data: ${deserialization.error}`
      })
    );
  }

  return makeSuccess(deserialization.deserialized);
}
