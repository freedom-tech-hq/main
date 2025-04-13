import { ArrowForwardIosOutlined } from '@mui/icons-material';
import type { ListItemTextSlotsAndSlotProps } from '@mui/material';
import { CircularProgress, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper, Typography, useTheme } from '@mui/material';
import { log } from 'freedom-async';
import type { Uuid } from 'freedom-basic-data';
import { makeUuid } from 'freedom-contexts';
import { LOCALIZE } from 'freedom-localization';
import { ELSE, IF } from 'freedom-logical-web-components';
import { useT } from 'freedom-react-localization';
import { useBinding, useCallbackRef } from 'react-bindings';
import { useDerivedWaitable, WC } from 'react-waitables';

import { useActiveUserId } from '../contexts/active-user-id.tsx';
import { useTasks } from '../contexts/tasks.tsx';
import { useTaskWaitable } from '../hooks/useTaskWaitable.ts';
import type { AppTheme } from './AppTheme.tsx';
import { NewAccountMasterPasswordDialog } from './new-account/NewAccountMasterPasswordDialog.tsx';
import { UnlockAccountMasterPasswordDialog } from './new-account/UnlockAccountMasterPasswordDialog.tsx';

const ns = 'ui';
const $accounts = LOCALIZE('Accounts')({ ns });
const $newAccount = LOCALIZE('New Account')({ ns });
const $untitled = LOCALIZE('untitled')({ ns });

export const AccountCreationOrLogin = () => {
  const activeUserId = useActiveUserId();
  const t = useT();
  const tasks = useTasks();
  const theme = useTheme<AppTheme>();

  const showNewAccountDialog = useBinding(() => false, { id: 'showNewAccountDialog', detectChanges: true });
  const busyWith = useBinding<undefined | 'creating-account' | 'unlocking-account'>(() => undefined, {
    id: 'busyWith',
    detectChanges: true
  });

  const unlockAccountDialogConfig = useBinding<{ localCredentialUuid: Uuid } | undefined>(() => undefined, {
    id: 'unlockAccountDialogConfig',
    detectChanges: true
  });

  const locallyStoredCredentialInfo = useTaskWaitable((tasks) => tasks.listLocallyStoredEncryptedEmailCredentials(), {
    id: 'locallyStoredCredentialInfo'
  });

  const hasLocallyStoredCredentials = useDerivedWaitable(
    locallyStoredCredentialInfo,
    (locallyStoredCredentialInfo) => locallyStoredCredentialInfo.length > 0,
    { id: 'hasLocallyStoredCredentials' }
  );

  const onNewAccountButtonClick = useCallbackRef(() => {
    if (tasks === undefined) {
      return; // Not ready
    }

    showNewAccountDialog.set(true);
  });

  const onSubmitNewAccountDialog = useCallbackRef(async ({ masterPassword }: { masterPassword: string }) => {
    showNewAccountDialog.set(false);

    busyWith.set('creating-account');
    try {
      const created = await tasks!.createUser({
        install: { description: `${makeUuid()}@freedommail.me - ${new Date().toISOString()}` },
        password: masterPassword
      });
      if (!created.ok) {
        // TODO: better error visibility
        log().error?.('Failed to create user', created.value);
        return;
      }

      activeUserId.set(created.value.userId);
    } finally {
      busyWith.set(undefined);
    }
  });

  const onOpenAccountButtonClick = useCallbackRef((localCredentialUuid: Uuid) => {
    if (tasks === undefined) {
      return; // Not ready
    }

    unlockAccountDialogConfig.set({ localCredentialUuid });
  });

  const onSubmitUnlockAccountDialog = useCallbackRef(
    async ({ localCredentialUuid, masterPassword }: { localCredentialUuid: Uuid; masterPassword: string }) => {
      unlockAccountDialogConfig.set(undefined);

      busyWith.set('unlocking-account');
      try {
        const unlocked = await tasks!.activateUserWithLocallyStoredEncryptedEmailCredentials({
          localCredentialUuid,
          password: masterPassword
        });
        if (!unlocked.ok) {
          // TODO: better error visibility
          log().error?.('Failed to activate user', unlocked.value);
          return;
        }

        activeUserId.set(unlocked.value.userId);
      } finally {
        busyWith.set(undefined);
      }
    }
  );

  return (
    <>
      <NewAccountMasterPasswordDialog show={showNewAccountDialog} onSubmit={onSubmitNewAccountDialog} />
      <UnlockAccountMasterPasswordDialog config={unlockAccountDialogConfig} onSubmit={onSubmitUnlockAccountDialog} />
      {IF(
        busyWith,
        () => (
          <List>
            <ListItem sx={{ justifyContent: 'center' }}>
              <CircularProgress size={22} />
            </ListItem>
          </List>
        ),
        ELSE(() => (
          <>
            <Typography variant="h2" mx={5} mt={3} mb={1} color="textSecondary">
              {$accounts(t)}
            </Typography>
            <Paper elevation={4} sx={{ mx: 3, mb: 3 }}>
              <List disablePadding>
                {WC(locallyStoredCredentialInfo, (locallyStoredCredentialInfo) => (
                  <>
                    {IF(hasLocallyStoredCredentials, () =>
                      locallyStoredCredentialInfo.map((credentialInfo) => (
                        <ListItemButton key={credentialInfo.localUuid} onClick={() => onOpenAccountButtonClick(credentialInfo.localUuid)}>
                          <ListItemText>{credentialInfo.description ?? $untitled(t)}</ListItemText>
                          <ListItemIcon sx={{ minWidth: 0 }}>
                            <ArrowForwardIosOutlined color="disabled" />
                          </ListItemIcon>
                        </ListItemButton>
                      ))
                    )}
                  </>
                ))}
                <ListItemButton onClick={onNewAccountButtonClick} sx={{ borderTop: `1px solid ${theme.palette.divider}` }}>
                  <ListItemText primary={$newAccount(t)} slotProps={newAccountSlotProps}>
                    {$newAccount(t)}
                  </ListItemText>
                </ListItemButton>
              </List>
            </Paper>
          </>
        ))
      )}
    </>
  );
};

// Helpers

const newAccountSlotProps: ListItemTextSlotsAndSlotProps['slotProps'] = { primary: { color: 'primary', fontWeight: 'bold' } };
