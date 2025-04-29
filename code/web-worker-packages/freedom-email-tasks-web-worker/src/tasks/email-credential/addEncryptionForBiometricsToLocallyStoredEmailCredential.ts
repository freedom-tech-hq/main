import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { base64String } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Uuid } from 'freedom-contexts';
import { encryptBufferWithPassword } from 'freedom-crypto';

import { getEmailCredentialObjectStore } from '../../internal/utils/getEmailCredentialObjectStore.ts';

export const addEncryptionForBiometricsToLocallyStoredEmailCredential = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    {
      localCredentialUuid,
      password,
      biometricPassword
    }: {
      localCredentialUuid: Uuid;
      password: string;
      biometricPassword: string;
    }
  ): PR<undefined, 'not-found'> => {
    const emailCredentialStore = await uncheckedResult(getEmailCredentialObjectStore(trace));

    const encryptedCredential = await emailCredentialStore.object(localCredentialUuid).get(trace);
    if (!encryptedCredential.ok) {
      return encryptedCredential;
    }

    const encryptedMasterPassword = await encryptBufferWithPassword(trace, {
      buffer: Buffer.from(password, 'utf-8'),
      password: biometricPassword
    });
    if (!encryptedMasterPassword.ok) {
      return encryptedMasterPassword;
    }

    const storedAccessor = emailCredentialStore.mutableObject(localCredentialUuid);
    const stored = await storedAccessor.getMutable(trace);
    if (!stored.ok) {
      return stored;
    }

    // Storing the master password encrypted using the biometricPassword
    stored.value.storedValue.pwEncryptedForBiometrics = base64String.makeWithBuffer(encryptedMasterPassword.value);
    const updated = await storedAccessor.update(trace, stored.value);
    if (!updated.ok) {
      return generalizeFailureResult(trace, updated, 'out-of-date');
    }

    return makeSuccess(undefined);
  }
);
