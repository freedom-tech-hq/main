import { Button, Stack, Tooltip, useTheme } from '@mui/material';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import type { ReactNode } from 'react';
import { BC, useBinding, useCallbackRef } from 'react-bindings';
import { useDerivedWaitable } from 'react-waitables';

import { Txt } from '../../../../components/reusable/aliases/Txt.tsx';
import { EmailField } from '../../../../components/reusable/form/fields/EmailField.tsx';
import { PasswordField } from '../../../../components/reusable/form/fields/PasswordField.tsx';
import { INPUT_DEBOUNCE_TIME_MSEC } from '../../../../consts/timing.ts';
import { useIsSizeClass } from '../../../../hooks/useIsSizeClass.ts';
import { useTaskWaitable } from '../../../../hooks/useTaskWaitable.ts';
import { BackIcon } from '../../../../icons/BackIcon.ts';
import { CheckIcon } from '../../../../icons/CheckIcon.ts';
import { InfoIcon } from '../../../../icons/InfoIcon.ts';
import { XIcon } from '../../../../icons/XIcon.ts';

const ns = 'ui';
const $back = LOCALIZE('Go Back')({ ns });
const $chooseEmail = LOCALIZE('Choose your email')({ ns });
const $createAccount = LOCALIZE('Create Account')({ ns });
const $createNewAccount = LOCALIZE('Create New Account')({ ns });
const $createPassword = LOCALIZE('Create your password')({ ns });
const $emailAvailable = LOCALIZE('This email is available')({ ns });
const $emailUnavailable = LOCALIZE('This email is already taken')({ ns });
const $invalidEmailUsername = LOCALIZE("This email isn't allowed")({ ns });
const $passwordTooltip = LOCALIZE(
  "Your password is used to access your account settings and mail.  It is only used locally on your device and is never sent to our servers.  If forgotten, it cannot be recovered – you'll need to create a new account."
)({ ns });

export interface CreateNewAccountPanelProps {
  onBackClick: () => void;
}

export const CreateNewAccountPanel = ({ onBackClick }: CreateNewAccountPanelProps) => {
  const t = useT();
  const theme = useTheme();
  const isMdOrLarger = useIsSizeClass('>=', 'md');
  const isLgOrLarger = useIsSizeClass('>=', 'lg');

  const emailUsername = useBinding<string>(() => '', { id: 'emailUsername', detectChanges: true });
  const password = useBinding<string>(() => '', { id: 'password', detectChanges: true });
  const isBusy = useBinding<boolean>(() => false, { id: 'isBusy', detectChanges: true });

  const checkedEmailAvailability = useTaskWaitable((tasks) => tasks.checkEmailAvailability({ emailUsername: emailUsername.get() }), {
    id: 'isEmailAddressAvailable',
    hardResetBindings: [emailUsername],
    limitMSec: INPUT_DEBOUNCE_TIME_MSEC
  });

  const emailHelperText = useDerivedWaitable(
    checkedEmailAvailability,
    {
      ifLoaded: ({ available }): ReactNode =>
        available ? (
          <Stack direction="row" alignItems="center" gap={0.5}>
            <CheckIcon color="success" className="sm-icon" />
            <Txt color="textDisabled" variant="inherit">
              {$emailAvailable(t)}
            </Txt>
          </Stack>
        ) : (
          <Stack direction="row" alignItems="center" gap={0.5}>
            <XIcon color="error" className="sm-icon" />
            <Txt color="textDisabled" variant="inherit">
              {$emailUnavailable(t)}
            </Txt>
          </Stack>
        ),
      ifError: (): ReactNode =>
        emailUsername.get().length > 0 && checkedEmailAvailability.error.get() !== undefined ? (
          <Stack direction="row" alignItems="center" gap={0.5}>
            <XIcon color="error" className="sm-icon" />
            <Txt color="textDisabled" variant="inherit">
              {$invalidEmailUsername(t)}
            </Txt>
          </Stack>
        ) : null
    },
    { id: 'emailHelperText' }
  );
  const emailError = useDerivedWaitable(
    checkedEmailAvailability,
    {
      ifLoaded: ({ available }) => emailUsername.get().length > 0 && !available,
      ifError: () => emailUsername.get().length > 0
    },
    { id: 'emailError' }
  );

  // TODO: use real form validation
  const isFormReady = useDerivedWaitable(
    { isBusy, emailUsername, password, checkedEmailAvailability },
    ({ isBusy, emailUsername, password, checkedEmailAvailability }) =>
      !isBusy && emailUsername.length > 0 && password.length > 0 && checkedEmailAvailability.available,
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
                {$createNewAccount(t)}
              </Txt>
            </Stack>

            <Stack alignSelf="stretch" alignItems="stretch" gap={3} sx={{ mt: 2 }}>
              <EmailField
                value={emailUsername}
                disabled={isBusy}
                autoFocus
                label={$chooseEmail(t)}
                error={emailError.value}
                helperText={emailHelperText.value}
              />
              <PasswordField
                value={password}
                disabled={isBusy}
                label={
                  <Stack direction="row" alignItems="center" gap={1.5}>
                    <Txt variant="inherit">{$createPassword(t)}</Txt>
                    <Tooltip title={$passwordTooltip(t)}>
                      <InfoIcon color="disabled" className="sm-icon" />
                    </Tooltip>
                  </Stack>
                }
              />
            </Stack>

            <Stack gap={2} className="self-stretch">
              {BC(isFormReady.value, (isFormReady = false) => (
                <Button type="submit" variant="contained" disabled={!isFormReady}>
                  {$createAccount(t)}
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
