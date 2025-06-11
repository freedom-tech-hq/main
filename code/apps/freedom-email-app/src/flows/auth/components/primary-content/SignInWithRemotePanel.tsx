import { Button, Stack, useTheme } from '@mui/material';
import { ONE_SEC_MSEC } from 'freedom-basic-data';
import { log, makeTrace } from 'freedom-contexts';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import { useHistory } from 'freedom-web-navigation';
import React from 'react';
import { BC, useBinding, useCallbackRef } from 'react-bindings';
import { useDerivedWaitable } from 'react-waitables';

import { Txt } from '../../../../components/reusable/aliases/Txt.ts';
import { EmailField } from '../../../../components/reusable/form/fields/EmailField.tsx';
import { PasswordField } from '../../../../components/reusable/form/fields/PasswordField.tsx';
import { appRoot } from '../../../../components/routing/appRoot.tsx';
import { $genericError, $tryAgain } from '../../../../consts/common-strings.ts';
import { useActiveAccountInfo } from '../../../../contexts/active-account-info.tsx';
import { useMessagePresenter } from '../../../../contexts/message-presenter.tsx';
import { useTasks } from '../../../../contexts/tasks.tsx';
import { useIsBusy } from '../../../../hooks/useIsBusy.tsx';
import { useIsSizeClass } from '../../../../hooks/useIsSizeClass.ts';
import { useWebAuthn } from '../../../../hooks/webauthn/useWebAuthn.ts';
import { BackIcon } from '../../../../icons/BackIcon.ts';
import { getTaskWorkerConfig } from '../../../../task-worker-configs/configs.ts';

const ns = 'ui';
const $back = LOCALIZE('Go Back')({ ns });
const $enterEmail = LOCALIZE('Enter your email')({ ns });
const $signInToAccount = LOCALIZE('Sign in to Account')({ ns });
const $signIn = LOCALIZE('Sign In')({ ns });
const $enterPassword = LOCALIZE('Enter your password')({ ns });

export const SignInWithRemotePanel = () => {
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

  const emailUsername = useBinding<string>(() => '', { id: 'emailUsername', detectChanges: true });
  const password = useBinding<string>(() => '', { id: 'password', detectChanges: true });

  // TODO: use real form validation
  const isFormReady = useDerivedWaitable(
    { isBusy, emailUsername, password },
    ({ isBusy, emailUsername, password }) => !isBusy && emailUsername.length > 0 && password.length > 0,
    { id: 'isFormReady', limitType: 'none' }
  );

  const onBackClick = useCallbackRef(() => {
    history.replace(appRoot.path.value);
  });

  const submit = useCallbackRef(async () => {
    if (tasks === undefined || !(isFormReady.value.get() ?? false)) {
      return;
    }

    return await isBusy.busyWhile(async () => {
      const email = `${emailUsername.get()}@${getTaskWorkerConfig().defaultEmailDomain}`;

      const imported = await tasks.importEmailCredentialFromRemote({ email });
      if (!imported.ok) {
        switch (imported.value.errorCode) {
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

      const masterPassword = password.get();
      const activated = await tasks.activateUserWithLocallyStoredEncryptedEmailCredentials({
        locallyStoredCredentialId: imported.value.locallyStoredCredentialId,
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

      await webAuthn.isAvailable.wait({ timeoutMSec: ONE_SEC_MSEC });
      if (webAuthn.isAvailable.value.get() === true) {
        await webAuthn.register(imported.value, { masterPassword });
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
            <Stack alignItems="center" justifyContent="center">
              <Txt variant="h2" className="semibold" textAlign="center">
                {$signInToAccount(t)}
              </Txt>
            </Stack>

            <Stack alignSelf="stretch" alignItems="stretch" gap={3} sx={{ mt: 2 }}>
              <EmailField value={emailUsername} disabled={isBusy} autoFocus label={$enterEmail(t)} />
              <PasswordField value={password} disabled={isBusy} label={$enterPassword(t)} />
            </Stack>

            <Stack gap={2} className="self-stretch">
              {BC(isFormReady.value, (isFormReady = false) => (
                <Button type="submit" variant="contained" disabled={!isFormReady}>
                  {$signIn(t)}
                </Button>
              ))}

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
