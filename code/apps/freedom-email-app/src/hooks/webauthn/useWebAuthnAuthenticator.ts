import { log, makeTrace } from 'freedom-contexts';
import type { LocallyStoredEncryptedEmailCredentialInfo } from 'freedom-email-tasks-web-worker';
import { useHistory } from 'freedom-web-navigation';
import { t } from 'i18next';
import { useCallbackRef } from 'react-bindings';

import { appRoot } from '../../components/routing/appRoot.tsx';
import { $genericError } from '../../consts/common-strings.ts';
import { useActiveAccountInfo } from '../../contexts/active-account-info.tsx';
import { useMessagePresenter } from '../../contexts/message-presenter.tsx';
import { useTasks } from '../../contexts/tasks.tsx';
import { authenticateWithWebAuthn } from '../../utils/webauthn/authenticateWithWebAuthn.ts';
import { useIsBusy } from '../useIsBusy.tsx';

export const useWebAuthnAuthenticator = () => {
  const activeAccountInfo = useActiveAccountInfo();
  const history = useHistory();
  const isBusy = useIsBusy();
  const { presentErrorMessage } = useMessagePresenter();
  const tasks = useTasks();

  return useCallbackRef(async (credential: LocallyStoredEncryptedEmailCredentialInfo) => {
    if (tasks === undefined) {
      return; // Not ready
    }

    return await isBusy.busyWhile(async () => {
      const trace = makeTrace(import.meta.filename);

      // Getting the password via WebAuthn
      const authenticated = await authenticateWithWebAuthn(trace, credential);
      if (!authenticated.ok) {
        log().error?.('WebAuthn authentication failed', authenticated.value);
        return;
      }

      // Trying to activate the user with the webauthn password
      const activated = await tasks.activateUserWithLocallyStoredEncryptedEmailCredentials({
        locallyStoredCredentialId: credential.locallyStoredCredentialId,
        password: authenticated.value.webAuthnPassword,
        passwordType: 'webauthn'
      });
      if (!activated.ok) {
        log().error?.(trace, 'Failed to activate user', activated.value);

        switch (activated.value.errorCode) {
          case 'not-found':
          case 'generic':
            presentErrorMessage($genericError(t));
            return;
        }
      }

      activeAccountInfo.set({ email: credential.email });
      history.replace(appRoot.path.mail('inbox').value);
    });
  });
};
