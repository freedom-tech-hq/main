import { Button, Stack, useTheme } from '@mui/material';
import { ONE_SEC_MSEC } from 'freedom-basic-data';
import { log, makeTrace } from 'freedom-contexts';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import { useHistory } from 'freedom-web-navigation';
import React from 'react';
import { BC, useBinding, useBindingEffect, useCallbackRef } from 'react-bindings';
import { useDerivedWaitable } from 'react-waitables';

import { Txt } from '../../../../components/reusable/aliases/Txt.ts';
import { PasswordField } from '../../../../components/reusable/form/fields/PasswordField.tsx';
import { appRoot } from '../../../../components/routing/appRoot.tsx';
import { $genericError, $tryAgain } from '../../../../consts/common-strings.ts';
import { useActiveAccountInfo } from '../../../../contexts/active-account-info.tsx';
import { useMessagePresenter } from '../../../../contexts/message-presenter.tsx';
import { useTasks } from '../../../../contexts/tasks.tsx';
import { useIsBusy } from '../../../../hooks/useIsBusy.tsx';
import { useIsSizeClass } from '../../../../hooks/useIsSizeClass.ts';
import { useTaskWaitable } from '../../../../hooks/useTaskWaitable.ts';
import { useWebAuthn } from '../../../../hooks/webauthn/useWebAuthn.ts';
import { BackIcon } from '../../../../icons/BackIcon.ts';
import { AccountListItem } from '../secondary-content/AccountListItem.tsx';

const ns = 'ui';
const $back = LOCALIZE('Go Back')({ ns });
const $enterPassword = LOCALIZE('Enter your password')({ ns });
const $signIn = LOCALIZE('Sign In')({ ns });
const $welcomeBack = LOCALIZE('Welcome back,')({ ns });

export interface LocalSignInPanelProps {
  email: string;
}

export const LocalSignInPanel = ({ email }: LocalSignInPanelProps) => {
  const activeAccountInfo = useActiveAccountInfo();
  const history = useHistory();
  const isBusy = useIsBusy();
  const { presentErrorMessage } = useMessagePresenter();
  const t = useT();
  const tasks = useTasks();
  const theme = useTheme();
  const webAuthn = useWebAuthn();

  const isMdOrLarger = useIsSizeClass('>=', 'md');
  const isLgOrLarger = useIsSizeClass('>=', 'lg');

  const locallyStoredEncryptedEmailCredentialInfo = useTaskWaitable(
    (tasks) => tasks.getLocallyStoredEncryptedEmailCredentialInfoByEmail(email),
    {
      id: 'locallyStoredEncryptedEmailCredentialInfo',
      onFailure: (error) => {
        if (error.errorCode === 'not-found') {
          history.replace(appRoot.path.value);
        }
      }
    }
  );

  // If the selected credential has webauthn enabled, we will try to authenticate with it immediately
  useBindingEffect(
    {
      isWebAuthnAvailable: webAuthn.isAvailable.value,
      locallyStoredEncryptedEmailCredentialInfo: locallyStoredEncryptedEmailCredentialInfo.value
    },
    ({ isWebAuthnAvailable = false, locallyStoredEncryptedEmailCredentialInfo }) => {
      if (
        !isWebAuthnAvailable ||
        locallyStoredEncryptedEmailCredentialInfo === undefined ||
        locallyStoredEncryptedEmailCredentialInfo.webAuthnCredentialId === undefined
      ) {
        return; // Not ready
      }

      // Not waiting
      webAuthn.authenticate(locallyStoredEncryptedEmailCredentialInfo);
    },
    { triggerOnMount: true }
  );

  const password = useBinding<string>(() => '', { id: 'password', detectChanges: true });

  // TODO: use real form validation
  const isFormReady = useDerivedWaitable(
    { locallyStoredEncryptedEmailCredentialInfo, isBusy, password },
    ({ isBusy, password }) => !isBusy && password.length > 0,
    {
      id: 'isFormReady',
      limitType: 'none'
    }
  );

  const onBackClick = useCallbackRef(() => {
    history.replace(appRoot.path.value);
  });

  const submit = useCallbackRef(async () => {
    const theLocallyStoredEncryptedEmailCredentialInfo = locallyStoredEncryptedEmailCredentialInfo.value.get();

    if (tasks === undefined || !(isFormReady.value.get() ?? false) || theLocallyStoredEncryptedEmailCredentialInfo === undefined) {
      return;
    }

    return await isBusy.busyWhile(async () => {
      const masterPassword = password.get();
      const activated = await tasks.activateUserWithLocallyStoredEncryptedEmailCredentials({
        locallyStoredCredentialId: theLocallyStoredEncryptedEmailCredentialInfo.locallyStoredCredentialId,
        password: masterPassword,
        passwordType: 'master'
      });
      if (!activated.ok) {
        log().error?.(makeTrace(import.meta.filename, 'submit'), 'Failed to activate user', activated.value);

        switch (activated.value.errorCode) {
          case 'not-found':
          case 'generic':
            presentErrorMessage($genericError(t), {
              action: ({ dismissThen }) => (
                <Button color="error" onClick={dismissThen(submit)}>
                  {$tryAgain(t)}
                </Button>
              )
            });
            return;
        }
      }

      if (theLocallyStoredEncryptedEmailCredentialInfo.webAuthnCredentialId === undefined) {
        await webAuthn.isAvailable.wait({ timeoutMSec: ONE_SEC_MSEC });
        if (webAuthn.isAvailable.value.get() === true) {
          await webAuthn.register(theLocallyStoredEncryptedEmailCredentialInfo, { masterPassword });
        }
      }

      activeAccountInfo.set({ email });
      history.replace(appRoot.path.mail('inbox').value);
    });
  });

  const onSubmit = useCallbackRef((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    submit();
  });

  return (
    <form onSubmit={onSubmit}>
      {BC({ isMdOrLarger, isLgOrLarger }, ({ isMdOrLarger, isLgOrLarger }) => (
        <Stack alignItems="center" justifyContent="center" sx={{ px: isLgOrLarger ? 3 : 2, py: 5 }}>
          <Stack
            alignItems="center"
            justifyContent="center"
            gap={isMdOrLarger ? 3 : 2}
            sx={{ width: '100%', maxWidth: `${theme.breakpoints.values.md}px` }}
          >
            <Stack alignItems="center" justifyContent="center" gap={1}>
              <Txt variant="h2" className="semibold" textAlign="center">
                {$welcomeBack(t)}
              </Txt>
              <AccountListItem email={email} />
            </Stack>

            <Stack alignSelf="stretch" alignItems="stretch" sx={{ mt: 2 }}>
              <PasswordField value={password} disabled={isBusy} autoFocus label={$enterPassword(t)} />
            </Stack>

            <Stack gap={2} className="self-stretch">
              <Button type="submit" variant="contained">
                {$signIn(t)}
              </Button>

              <Button
                variant="text"
                className="default-text"
                onClick={onBackClick}
                startIcon={<BackIcon className="default-text sm-icon" />}
              >
                {$back(t)}
              </Button>
            </Stack>
          </Stack>
        </Stack>
      ))}
    </form>
  );
};
