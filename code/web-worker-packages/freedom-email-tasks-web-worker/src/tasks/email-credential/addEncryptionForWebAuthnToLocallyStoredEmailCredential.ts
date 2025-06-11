import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import type { Base64String } from 'freedom-basic-data';
import { base64String } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import { encryptBufferWithPassword } from 'freedom-crypto';

import { getEmailCredentialObjectStore } from '../../internal/utils/getEmailCredentialObjectStore.ts';
import type { LocallyStoredCredentialId } from '../../types/id/LocallyStoredCredentialId.ts';

export const addEncryptionForWebAuthnToLocallyStoredEmailCredential = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    {
      locallyStoredCredentialId,
      password,
      webAuthnCredentialId,
      webAuthnPassword
    }: {
      locallyStoredCredentialId: LocallyStoredCredentialId;
      password: string;
      webAuthnCredentialId: Base64String;
      webAuthnPassword: string;
    }
  ): PR<undefined, 'not-found'> => {
    const emailCredentialStore = await uncheckedResult(getEmailCredentialObjectStore(trace));

    const storedCredential = await emailCredentialStore.object(locallyStoredCredentialId).get(trace);
    if (!storedCredential.ok) {
      return storedCredential;
    }

    const encryptedMasterPassword = await encryptBufferWithPassword(trace, {
      buffer: Buffer.from(password, 'utf-8'),
      password: webAuthnPassword
    });
    if (!encryptedMasterPassword.ok) {
      return encryptedMasterPassword;
    }

    const storedAccessor = emailCredentialStore.mutableObject(locallyStoredCredentialId);
    const found = await storedAccessor.getMutable(trace);
    if (!found.ok) {
      return found;
    }

    // Storing the master password encrypted using the webAuthnPassword
    found.value.storedValue.webAuthnCredentialId = webAuthnCredentialId;
    found.value.storedValue.pwEncryptedForWebAuthn = base64String.makeWithBuffer(encryptedMasterPassword.value);
    const updated = await storedAccessor.update(trace, found.value);
    if (!updated.ok) {
      return generalizeFailureResult(trace, updated, 'out-of-date');
    }

    return makeSuccess(undefined);
  }
);
