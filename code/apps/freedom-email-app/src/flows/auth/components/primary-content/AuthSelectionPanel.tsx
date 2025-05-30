import { Button, Stack, useTheme } from '@mui/material';
import type { LocallyStoredEncryptedEmailCredentialInfo } from 'freedom-email-tasks-web-worker';
import { LOCALIZE } from 'freedom-localization';
import { IF } from 'freedom-logical-web-components';
import { useT } from 'freedom-react-localization';
import { BC } from 'react-bindings';
import { useDerivedWaitable } from 'react-waitables';

import { Txt } from '../../../../components/reusable/aliases/Txt.tsx';
import { AppDivider } from '../../../../components/reusable/AppDivider.tsx';
import { useTasks } from '../../../../contexts/tasks.tsx';
import { useIsSizeClass } from '../../../../hooks/useIsSizeClass.ts';
import { useTaskWaitable } from '../../../../hooks/useTaskWaitable.ts';
import { CompanyLogoIcon } from '../../../../icons/CompanyLogoIcon.ts';
import { ImportIcon } from '../../../../icons/ImportIcon.ts';
import { UserRoundPlusIcon } from '../../../../icons/UserRoundPlusIcon.ts';
import { AccountList } from '../secondary-content/AccountList.tsx';

const ns = 'ui';
const $createNewAccount = LOCALIZE('Create New Account')({ ns });
const $importCredential = LOCALIZE('Import Credential')({ ns });
const $instructions = LOCALIZE('Choose an account to continue')({ ns });
const $or = LOCALIZE('or')({ ns });
const $signInToAccount = LOCALIZE('Sign in to Account')({ ns });
const $signInToAnotherAccount = LOCALIZE('Sign in to Another Account')({ ns });
const $welcome = LOCALIZE('Welcome to Freedom Mail!')({ ns });

export interface AuthSelectionPanelProps {
  onAccountClick: (account: LocallyStoredEncryptedEmailCredentialInfo) => void;
  onCreateNewAccountClick: () => void;
  onImportCredentialClick: () => void;
  onSignInWithRemoteClick: () => void;
}

export const AuthSelectionPanel = ({
  onAccountClick,
  onCreateNewAccountClick,
  onImportCredentialClick,
  onSignInWithRemoteClick
}: AuthSelectionPanelProps) => {
  const t = useT();
  const tasks = useTasks();
  const theme = useTheme();
  const isMdOrLarger = useIsSizeClass('>=', 'md');
  const isLgOrLarger = useIsSizeClass('>=', 'lg');

  const locallyStoredEncryptedEmailCredentials = useTaskWaitable((tasks) => tasks.listLocallyStoredEncryptedEmailCredentials(), {
    id: 'locallyStoredEncryptedEmailCredentials'
  });
  const hasAtLeastOneAccount = useDerivedWaitable(locallyStoredEncryptedEmailCredentials, (accounts) => accounts.length > 0, {
    id: 'hasAtLeastOneAccount'
  });

  return (
    <>
      {BC({ isMdOrLarger, isLgOrLarger }, ({ isMdOrLarger, isLgOrLarger }) => (
        <Stack alignItems="center" justifyContent="center" sx={{ px: isLgOrLarger ? 3 : 2, py: 5 }}>
          <Stack
            alignItems="center"
            justifyContent="center"
            gap={isMdOrLarger ? 3 : 2}
            sx={{ maxWidth: `${theme.breakpoints.values.md}px` }}
          >
            {IF(!isMdOrLarger, () => (
              <CompanyLogoIcon color="primary" className="lg-icon" />
            ))}

            <Stack alignItems="center" justifyContent="center" gap={2}>
              <Stack alignItems="center" justifyContent="center">
                <Txt variant="h2" className="semibold" textAlign="center">
                  {$welcome(t)}
                </Txt>
                {IF(hasAtLeastOneAccount, () => (
                  <Txt variant="body1" textAlign="center">
                    {$instructions(t)}
                  </Txt>
                ))}
              </Stack>

              <AccountList onAccountClick={onAccountClick} />
            </Stack>

            <Button
              variant="text"
              className="self-stretch default-text"
              startIcon={<UserRoundPlusIcon className="default-text sm-icon" />}
              onClick={onSignInWithRemoteClick}
            >
              {BC(hasAtLeastOneAccount.value, (hasAtLeastOneAccount) =>
                (hasAtLeastOneAccount ?? false) ? $signInToAnotherAccount(t) : $signInToAccount(t)
              )}
            </Button>

            <AppDivider label={$or(t)} />

            <Stack gap={2} className="self-stretch">
              <Button variant="contained" color="primary" onClick={onCreateNewAccountClick}>
                {$createNewAccount(t)}
              </Button>

              <Button
                variant="text"
                className="default-text"
                onClick={onImportCredentialClick}
                startIcon={<ImportIcon className="default-text sm-icon" />}
                disabled={tasks === undefined}
              >
                {$importCredential(t)}
              </Button>
            </Stack>
          </Stack>
        </Stack>
      ))}
    </>
  );
};
