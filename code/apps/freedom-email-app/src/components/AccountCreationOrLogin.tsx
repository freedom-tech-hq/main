import { ArrowForwardIosOutlined } from '@mui/icons-material';
import type { ListItemTextSlotsAndSlotProps } from '@mui/material';
import { CircularProgress, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper, Typography, useTheme } from '@mui/material';
import { log } from 'freedom-async';
import { base64String, type Uuid } from 'freedom-basic-data';
import { makeUuid } from 'freedom-contexts';
import { LOCALIZE } from 'freedom-localization';
import { ELSE, IF } from 'freedom-logical-web-components';
import { useT } from 'freedom-react-localization';
import { useMemo } from 'react';
import { useBinding, useCallbackRef } from 'react-bindings';
import { useDerivedWaitable, WC } from 'react-waitables';

import { useActiveLocallyStoredCredentialUuid } from '../contexts/active-locally-stored-credential-uuid.tsx';
import { useActiveUserId } from '../contexts/active-user-id.tsx';
import { useTasks } from '../contexts/tasks.tsx';
import { useTaskWaitable } from '../hooks/useTaskWaitable.ts';
import type { AppTheme } from './AppTheme.tsx';
import { NewAccountMasterPasswordDialog } from './new-account/NewAccountMasterPasswordDialog.tsx';
import { UnlockAccountMasterPasswordDialog } from './new-account/UnlockAccountMasterPasswordDialog.tsx';

const ns = 'ui';
const $accounts = LOCALIZE('Accounts')({ ns });
const $importCredential = LOCALIZE('Import Credential')({ ns });
const $newAccount = LOCALIZE('New Account')({ ns });
const $untitled = LOCALIZE('untitled')({ ns });

export const AccountCreationOrLogin = () => {
  const activeLocallyStoredCredentialUuid = useActiveLocallyStoredCredentialUuid();
  const activeUserId = useActiveUserId();
  const t = useT();
  const tasks = useTasks();
  const theme = useTheme<AppTheme>();
  const uuid = useMemo(() => makeUuid(), []);

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

  const onFileChange = useCallbackRef(() => {
    if (tasks === undefined) {
      return; // Not ready
    }

    const elem = document.getElementById(`${uuid}-file-input`);
    if (elem === null) {
      return; // Not ready
    }

    const input = elem as HTMLInputElement;
    if (input.files === null || input.files.length === 0) {
      return; // Nothing selected
    }

    const firstFile = input.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      const encryptedEmailCredential = e.target?.result;
      if (typeof encryptedEmailCredential !== 'string') {
        return;
      } else if (!base64String.is(encryptedEmailCredential)) {
        return;
      }

      const imported = await tasks.importEmailCredential({
        description: `Imported - ${new Date().toISOString()}`,
        encryptedEmailCredential
      });
      if (!imported.ok) {
        log().error?.('Failed to import email credential', imported.value);
      }

      locallyStoredCredentialInfo.reset('hard');
    };
    reader.readAsText(firstFile);
  });

  const onImportCredentialButtonClick = useCallbackRef(() => {
    const elem = document.getElementById(`${uuid}-file-input`);
    if (elem === null) {
      return;
    }

    elem.click();
  });

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

      activeLocallyStoredCredentialUuid.set(created.value.locallyStoredCredentialUuid);
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

        activeLocallyStoredCredentialUuid.set(localCredentialUuid);
        activeUserId.set(unlocked.value.userId);
      } finally {
        busyWith.set(undefined);
      }
    }
  );

  return (
    <>
      <input id={`${uuid}-file-input`} type="file" accept=".credential" onChange={onFileChange} style={{ display: 'none' }} />

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
                          <ListItemText primary={credentialInfo.description ?? $untitled(t)} />
                          <ListItemIcon sx={{ minWidth: 0 }}>
                            <ArrowForwardIosOutlined color="disabled" />
                          </ListItemIcon>
                        </ListItemButton>
                      ))
                    )}
                  </>
                ))}

                <ListItemButton onClick={onImportCredentialButtonClick} sx={{ borderTop: `1px solid ${theme.palette.divider}` }}>
                  <ListItemText primary={$importCredential(t)} slotProps={emphasizedListItemButtonTextSlotProps} />
                </ListItemButton>

                <ListItemButton onClick={onNewAccountButtonClick} sx={{ borderTop: `1px solid ${theme.palette.divider}` }}>
                  <ListItemText primary={$newAccount(t)} slotProps={emphasizedListItemButtonTextSlotProps} />
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

const emphasizedListItemButtonTextSlotProps: ListItemTextSlotsAndSlotProps['slotProps'] = {
  primary: { color: 'primary', fontWeight: 'bold' }
};
