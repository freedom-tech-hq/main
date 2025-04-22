import fs from 'node:fs/promises';
import path from 'node:path';

import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { CombinationCryptoKeySet } from 'freedom-crypto-data';
import { combinationCryptoKeySetSchema } from 'freedom-crypto-data';
import type { EmailUserId } from 'freedom-email-sync';

import { getAllStorageRootPath } from './getAllStorageRootPath.ts';

export interface User {
  email: string;
  userId: EmailUserId;
  publicKeys: CombinationCryptoKeySet;
  defaultSalt: string;
}

type InnerUser = Omit<User, 'publicKeys'> & {
  publicKeys: typeof combinationCryptoKeySetSchema.valueType;
};

let dbFilePath: string | undefined = undefined;

async function requireConnection(trace: Trace) {
  if (dbFilePath) {
    return;
  }

  const storageRootPath = await getAllStorageRootPath(trace);
  if (!storageRootPath.ok) {
    throw new Error(`Failed to get storage root path: ${storageRootPath.value.message}`);
  }

  dbFilePath = path.join(storageRootPath.value, 'mock-db.json');

  // Ensure the DB file exists
  try {
    await fs.access(dbFilePath);
  } catch {
    // File doesn't exist, create it with empty array
    await fs.writeFile(dbFilePath, JSON.stringify([], null, 2));
  }
}

const readDb = async (): Promise<InnerUser[]> => {
  if (!dbFilePath) {
    throw new Error('Database not connected');
  }
  const data = await fs.readFile(dbFilePath, 'utf-8');
  return JSON.parse(data);
};

const writeDb = async (users: InnerUser[]): Promise<void> => {
  if (!dbFilePath) {
    throw new Error('Database not connected');
  }
  await fs.writeFile(dbFilePath, JSON.stringify(users, null, 2));
};

export const addUser = makeAsyncResultFunc([import.meta.filename, 'addUser'], async (trace, user: User): PR<User> => {
  await requireConnection(trace);

  const users = await readDb();

  // Check if user already exists
  const existingUserIndex = users.findIndex((u) => u.email === user.email);

  // Serialize
  const serialized = await combinationCryptoKeySetSchema.serializeAsync(user.publicKeys);
  if (!serialized.serialized || serialized.error) {
    return makeFailure(new GeneralError(trace, new Error(`Serialization is broken '${serialized.error}'`)));
  }

  const serializedUser: InnerUser = {
    ...user,
    publicKeys: serialized.serialized as any // TODO: Revise the type problem, but it is probably in yaschema
  };

  // Save
  if (existingUserIndex !== -1) {
    // Update existing
    users[existingUserIndex] = serializedUser;
  } else {
    // Add new
    users.push(serializedUser);
  }

  await writeDb(users);
  return makeSuccess(user);
});

export const findUserByEmail = makeAsyncResultFunc(
  [import.meta.filename, 'findUserByEmail'],
  async (trace, email: string): PR<User | null> => {
    await requireConnection(trace);

    const users = await readDb();
    const serializedUser = users.find((u) => u.email === email);
    if (!serializedUser) {
      return makeSuccess(null); // TODO: Should return a NotFoundError
    }

    const publicKeys = await combinationCryptoKeySetSchema.deserializeAsync(serializedUser.publicKeys);
    if (!publicKeys.deserialized || publicKeys.error) {
      return makeFailure(new GeneralError(trace, new Error(`Database is corrupted '${publicKeys.error}'`)));
    }

    const user: User | null = serializedUser
      ? {
          ...serializedUser,
          publicKeys: publicKeys.deserialized
        }
      : null;

    return makeSuccess(user);
  }
);

export const getAllUsers = makeAsyncResultFunc([import.meta.filename, 'getAllUsers'], async (trace): PR<User[]> => {
  await requireConnection(trace);

  const serializedUsers = await readDb();
  const users: User[] = [];

  for (const serializedUser of serializedUsers) {
    const publicKeys = await combinationCryptoKeySetSchema.deserializeAsync(serializedUser.publicKeys);
    if (!publicKeys.deserialized || publicKeys.error) {
      return makeFailure(new GeneralError(trace, new Error(`Database is corrupted '${publicKeys.error}'`)));
    }

    users.push({
      ...serializedUser,
      publicKeys: publicKeys.deserialized
    });
  }

  return makeSuccess(users);
});
