import { Button, Collapse, Stack, useTheme } from '@mui/material';
import type { LocallyStoredEncryptedEmailCredentialInfo } from 'freedom-email-tasks-web-worker';
import { LOCALIZE } from 'freedom-localization';
import { IF } from 'freedom-logical-web-components';
import { useT } from 'freedom-react-localization';
import { SLOW_ANIMATION_DURATION_MSEC } from 'freedom-web-animation';
import React from 'react';
import { BC } from 'react-bindings';
import { useDerivedWaitable } from 'react-waitables';

import { Txt } from '../../../../components/reusable/aliases/Txt.ts';
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

  return BC({ isMdOrLarger, isLgOrLarger }, ({ isMdOrLarger, isLgOrLarger }) => (
    <Stack alignItems="center" justifyContent="center" sx={{ px: isLgOrLarger ? 3 : 2, py: 5 }}>
      <Stack
        alignItems="center"
        justifyContent="center"
        gap={isMdOrLarger ? 3 : 2}
        sx={{ width: '100%', maxWidth: `${theme.breakpoints.values.md}px` }}
      >
        {IF(!isMdOrLarger, () => (
          <CompanyLogoIcon color="primary" className="lg-icon" />
        ))}

        <Stack alignItems="center" gap={2}>
          <Stack alignItems="center">
            <Txt variant="h2" className="semibold" textAlign="center">
              {$welcome(t)}
            </Txt>
            {BC(
              { isLoaded: locallyStoredEncryptedEmailCredentials.isComplete, hasAtLeastOneAccount: hasAtLeastOneAccount.value },
              ({ isLoaded, hasAtLeastOneAccount = false }) => (
                <Collapse in={isLoaded && hasAtLeastOneAccount} timeout={SLOW_ANIMATION_DURATION_MSEC}>
                  <Txt variant="body1" textAlign="center">
                    {$instructions(t)}
                  </Txt>
                </Collapse>
              )
            )}
          </Stack>

          {BC(
            { isLoaded: locallyStoredEncryptedEmailCredentials.isComplete, hasAtLeastOneAccount: hasAtLeastOneAccount.value },
            ({ isLoaded, hasAtLeastOneAccount = false }) => (
              <Collapse in={isLoaded && hasAtLeastOneAccount} timeout={SLOW_ANIMATION_DURATION_MSEC}>
                <AccountList onAccountClick={onAccountClick} />
              </Collapse>
            )
          )}
        </Stack>

        {BC({ isLoaded: locallyStoredEncryptedEmailCredentials.isComplete }, ({ isLoaded }) => (
          <Collapse in={isLoaded} timeout={SLOW_ANIMATION_DURATION_MSEC} sx={{ alignSelf: 'stretch' }}>
            <Stack alignItems="stretch" gap={isMdOrLarger ? 3 : 2}>
              <Button
                variant="text"
                className="default-text"
                startIcon={<UserRoundPlusIcon className="default-text sm-icon" />}
                onClick={onSignInWithRemoteClick}
              >
                {BC(hasAtLeastOneAccount.value, (hasAtLeastOneAccount) =>
                  (hasAtLeastOneAccount ?? false) ? $signInToAnotherAccount(t) : $signInToAccount(t)
                )}
              </Button>

              <AppDivider label={$or(t)} />

              <Stack gap={2}>
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
          </Collapse>
        ))}
      </Stack>
    </Stack>
  ));
};
