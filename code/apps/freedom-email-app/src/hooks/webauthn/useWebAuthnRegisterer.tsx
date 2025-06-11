import { log, makeTrace } from 'freedom-contexts';
import type { LocallyStoredEncryptedEmailCredentialInfo } from 'freedom-email-tasks-web-worker';
import { useT } from 'freedom-react-localization';
import React from 'react';
import { useCallbackRef } from 'react-bindings';

import { $genericError } from '../../consts/common-strings.ts';
import { useMessagePresenter } from '../../contexts/message-presenter.tsx';
import { useTasks } from '../../contexts/tasks.tsx';
import { useTransientContent } from '../../contexts/transient-content.tsx';
import { AddPasskeyDialog } from '../../flows/auth/components/secondary-content/AddPasskeyDialog.tsx';
import { VerifyPasskeyDialog } from '../../flows/auth/components/secondary-content/VerifyPasskeyDialog.tsx';
import { authenticateWithWebAuthn } from '../../utils/webauthn/authenticateWithWebAuthn.ts';
import { registerWebAuthnCredential } from '../../utils/webauthn/registerWebAuthnCredential.ts';
import { useIsBusy } from '../useIsBusy.tsx';

export const useWebAuthnRegisterer = () => {
  const isBusy = useIsBusy();
  const { presentErrorMessage } = useMessagePresenter();
  const t = useT();
  const tasks = useTasks();
  const transientContent = useTransientContent();

  return useCallbackRef(async (credential: LocallyStoredEncryptedEmailCredentialInfo, { masterPassword }: { masterPassword: string }) => {
    const trace = makeTrace(import.meta.filename);

    if (tasks === undefined) {
      return; // Not ready
    }

    return await isBusy.busyWhile(async () => {
      // Prompting the user to confirm if they want to add a passkey
      const confirmed = await transientContent.present<true>(({ dismiss }) => (
        <AddPasskeyDialog deny={dismiss} confirm={() => dismiss(true)} />
      )).promise;
      if (confirmed !== true) {
        return;
      }

      const registered = await registerWebAuthnCredential(trace, credential);
      if (!registered.ok) {
        log().error?.(trace, 'Failed to register passkey', registered.value);
        switch (registered.value.errorCode) {
          case 'unauthorized':
            break;
          case 'generic':
            presentErrorMessage($genericError(t));
            break;
        }

        return;
      }

      // Prompting the user to confirm that they're ready for their passkey to be verified
      const isReadyForAuthorization = await transientContent.present<true>(({ dismiss }) => (
        <VerifyPasskeyDialog deny={dismiss} confirm={() => dismiss(true)} />
      )).promise;
      if (isReadyForAuthorization !== true) {
        return;
      }

      // Getting the webauthn password
      const authenticated = await authenticateWithWebAuthn(trace, {
        ...credential,
        webAuthnCredentialId: registered.value.webAuthnCredentialId
      });
      if (!authenticated.ok) {
        log().error?.(trace, 'Failed to register webauthn', registered.value);
        switch (authenticated.value.errorCode) {
          case 'unauthorized':
            break;
          case 'generic':
            presentErrorMessage($genericError(t));
            break;
        }

        return;
      }

      const added = await tasks.addEncryptionForWebAuthnToLocallyStoredEmailCredential({
        locallyStoredCredentialId: credential.locallyStoredCredentialId,
        password: masterPassword,
        webAuthnCredentialId: registered.value.webAuthnCredentialId,
        webAuthnPassword: authenticated.value.webAuthnPassword
      });
      if (!added.ok) {
        log().error?.(trace, 'Failed to add webauthn to credential', added.value);
        switch (added.value.errorCode) {
          case 'not-found':
          case 'generic':
            presentErrorMessage($genericError(t));
            return;
        }
      }
    });
  });
};
