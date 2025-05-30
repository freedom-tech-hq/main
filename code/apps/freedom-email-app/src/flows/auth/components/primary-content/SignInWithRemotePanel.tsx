import { Button, Stack, useTheme } from '@mui/material';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import React from 'react';
import { BC, useBinding, useCallbackRef } from 'react-bindings';
import { useDerivedWaitable } from 'react-waitables';

import { Txt } from '../../../../components/reusable/aliases/Txt.ts';
import { EmailField } from '../../../../components/reusable/form/fields/EmailField.tsx';
import { PasswordField } from '../../../../components/reusable/form/fields/PasswordField.tsx';
import { useIsSizeClass } from '../../../../hooks/useIsSizeClass.ts';
import { BackIcon } from '../../../../icons/BackIcon.ts';

const ns = 'ui';
const $back = LOCALIZE('Go Back')({ ns });
const $enterEmail = LOCALIZE('Enter your email')({ ns });
const $signInToAccount = LOCALIZE('Sign in to Account')({ ns });
const $signIn = LOCALIZE('Sign In')({ ns });
const $enterPassword = LOCALIZE('Enter your password')({ ns });

export interface SignInWithRemotePanelProps {
  onBackClick: () => void;
}

export const SignInWithRemotePanel = ({ onBackClick }: SignInWithRemotePanelProps) => {
  const t = useT();
  const theme = useTheme();
  const isMdOrLarger = useIsSizeClass('>=', 'md');
  const isLgOrLarger = useIsSizeClass('>=', 'lg');

  const emailUsername = useBinding<string>(() => '', { id: 'emailUsername', detectChanges: true });
  const password = useBinding<string>(() => '', { id: 'password', detectChanges: true });
  const isBusy = useBinding<boolean>(() => false, { id: 'isBusy', detectChanges: true });

  // TODO: use real form validation
  const isFormReady = useDerivedWaitable(
    { isBusy, emailUsername, password },
    ({ isBusy, emailUsername, password }) => !isBusy && emailUsername.length > 0 && password.length > 0,
    { id: 'isFormReady', limitType: 'none' }
  );

  const onSubmit = useCallbackRef((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!(isFormReady.value.get() ?? false)) {
      return;
    }

    // TODO: TEMP
    console.log('onSubmit', password.get(), isBusy.get());
  });

  return (
    <form onSubmit={onSubmit}>
      {BC({ isMdOrLarger, isLgOrLarger }, ({ isMdOrLarger, isLgOrLarger }) => (
        <Stack alignItems="center" justifyContent="center" sx={{ px: isLgOrLarger ? 3 : 2, py: 5 }}>
          <Stack
            alignItems="center"
            justifyContent="center"
            gap={isMdOrLarger ? 3 : 2}
            sx={{ maxWidth: `${theme.breakpoints.values.md}px` }}
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
