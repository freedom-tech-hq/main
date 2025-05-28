import { Button, Stack, useTheme } from '@mui/material';
import type { LocallyStoredEncryptedEmailCredentialInfo } from 'freedom-email-tasks-web-worker';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import { BC, useBinding, useCallbackRef } from 'react-bindings';

import { MasterPasswordField } from '../../../../components/deprecated/auth/fields/MasterPasswordField.tsx';
import { Txt } from '../../../../components/reusable/aliases/Txt.tsx';
import { useIsSizeClass } from '../../../../hooks/useIsSizeClass.ts';
import { BackIcon } from '../../../../icons/BackIcon.ts';
import { AccountListItem } from '../secondary-content/AccountListItem.tsx';

const ns = 'ui';
const $back = LOCALIZE('Back')({ ns });
const $enterPassword = LOCALIZE('Enter your password')({ ns });
const $signIn = LOCALIZE('Sign In')({ ns });
const $welcomeBack = LOCALIZE('Welcome back,')({ ns });

export interface LocalSignInPanelProps {
  account: LocallyStoredEncryptedEmailCredentialInfo;
  onBackClick: () => void;
}

export const LocalSignInPanel = ({ account, onBackClick }: LocalSignInPanelProps) => {
  const t = useT();
  const theme = useTheme();
  const isMdOrLarger = useIsSizeClass('>=', 'md');
  const isLgOrLarger = useIsSizeClass('>=', 'lg');

  const masterPassword = useBinding<string>(() => '', { id: 'masterPassword', detectChanges: true });
  const isBusy = useBinding<boolean>(() => false, { id: 'isBusy', detectChanges: true });

  const onSubmit = useCallbackRef((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // TODO: TEMP
    console.log('onSubmit', masterPassword.get(), isBusy.get());
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
            <Stack alignItems="center" justifyContent="center" gap={1}>
              <Txt variant="h2" className="semibold" textAlign="center">
                {$welcomeBack(t)}
              </Txt>
              <AccountListItem account={account} />
            </Stack>

            <Stack alignSelf="stretch" alignItems="stretch" sx={{ mt: 2 }}>
              <MasterPasswordField value={masterPassword} disabled={isBusy} autoFocus label={$enterPassword(t)} />
            </Stack>

            <Stack gap={2} sx={{ alignSelf: 'stretch' }}>
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
