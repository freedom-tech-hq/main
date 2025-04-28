import { ArrowForwardIosOutlined, LockOpen } from '@mui/icons-material';
import type { ListItemTextSlotsAndSlotProps } from '@mui/material';
import { Button, CircularProgress, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper, Stack, TextField, Typography, useTheme } from '@mui/material';
import { log } from 'freedom-async';
import { base64String, type Uuid } from 'freedom-basic-data';
import { makeUuid } from 'freedom-contexts';
import { LOCALIZE } from 'freedom-localization';
import { ELSE, IF } from 'freedom-logical-web-components';
import { useT } from 'freedom-react-localization';
import { useHistory } from 'freedom-web-navigation';
import { noop } from 'lodash-es';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useBinding, useCallbackRef } from 'react-bindings';
import { useDerivedWaitable, WC } from 'react-waitables';

import { deriveKeyFromPassword, encryptCredential, retrieveCredentialFromServer, storeCredentialOnServer } from '../utils/credentialServerStorage.ts';

import { useActiveLocallyStoredCredentialUuid } from '../contexts/active-locally-stored-credential-uuid.tsx';
import { useActiveUserId } from '../contexts/active-user-id.tsx';
import { useTasks } from '../contexts/tasks.tsx';
import { useTransientContent } from '../contexts/transient-content.tsx';
import { useTaskWaitable } from '../hooks/useTaskWaitable.ts';
import type { AppTheme } from './AppTheme.tsx';
import { NewAccountMasterPasswordDialog } from './new-account/NewAccountMasterPasswordDialog.tsx';
import { UnlockAccountMasterPasswordDialog } from './new-account/UnlockAccountMasterPasswordDialog.tsx';

const ns = 'ui';
const $accounts = LOCALIZE('Accounts')({ ns });
const $importCredential = LOCALIZE('Import Credential')({ ns });
const $newAccount = LOCALIZE('New Account')({ ns });
const $loginWithUsernamePassword = LOCALIZE('Login with Username & Password')({ ns });
const $username = LOCALIZE('Username')({ ns });
const $password = LOCALIZE('Password')({ ns });
const $login = LOCALIZE('Login')({ ns });
const $untitled = LOCALIZE('untitled')({ ns });

export const AccountCreationOrLogin = () => {
  const activeLocallyStoredCredentialUuid = useActiveLocallyStoredCredentialUuid();
  const activeUserId = useActiveUserId();
  const history = useHistory();
  const t = useT();
  const tasks = useTasks();
  const theme = useTheme<AppTheme>();
  const transientContent = useTransientContent();
  const uuid = useMemo(() => makeUuid(), []);

  // State for server login
  const [showServerLogin, setShowServerLogin] = useState(false);
  const [serverLoginUsername, setServerLoginUsername] = useState('');
  const [serverLoginPassword, setServerLoginPassword] = useState('');
  const [isLoggingInWithServer, setIsLoggingInWithServer] = useState(false);

  const busyWith = useBinding<undefined | 'creating-account' | 'unlocking-account' | 'retrieving-from-server'>(() => undefined, {
    id: 'busyWith',
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

  useEffect(() => {
    history.replace('/');
  });

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

  const dismissNewAccountDialog = useRef<() => void>(noop);
  const onNewAccountButtonClick = useCallbackRef(() => {
    if (tasks === undefined) {
      return; // Not ready
    }

    dismissNewAccountDialog.current = transientContent.present(({ dismiss }) => (
      <NewAccountMasterPasswordDialog dismiss={dismiss} onSubmit={onSubmitNewAccountDialog} />
    ));
  });

  const onSubmitNewAccountDialog = useCallbackRef(async ({ username, masterPassword }: { username: string; masterPassword: string }) => {
    dismissNewAccountDialog.current();

    busyWith.set('creating-account');
    try {
      // Create the account
      const created = await tasks!.createUser({
        install: { description: `${username}@freedommail.me - ${new Date().toISOString()}` },
        password: masterPassword
      });
      if (!created.ok) {
        // TODO: better error visibility
        log().error?.('Failed to create user', created.value);
        return;
      }

      // Store the encrypted credential on the server
      try {
        // Generate a random salt for key derivation
        const salt = crypto.getRandomValues(new Uint8Array(16));
        
        // Derive encryption key from master password
        const key = await deriveKeyFromPassword(masterPassword, salt);
        
        // Encrypt the credential with the derived key
        const { encryptedData, iv } = await encryptCredential(created.value.encryptedEmailCredential, key);
        
        // Store on server using both username and password for the lookup key
        await storeCredentialOnServer(
          username,
          masterPassword,
          encryptedData,
          `${username}@freedommail.me - ${new Date().toISOString()}`,
          salt,
          iv
        );
        
        log().info?.('Credential successfully stored on server');
      } catch (error) {
        log().error?.('Failed to store credential on server', error);
        // Continue anyway as the local storage still works
      }

      history.replace('/mail');

      activeLocallyStoredCredentialUuid.set(created.value.locallyStoredCredentialUuid);
      activeUserId.set(created.value.userId);
    } finally {
      busyWith.set(undefined);
    }
  });

  // Handler for server-based login
  const handleServerLogin = useCallbackRef(async () => {
    if (tasks === undefined || !serverLoginUsername || !serverLoginPassword) {
      return;
    }
    
    setIsLoggingInWithServer(true);
    busyWith.set('retrieving-from-server');
    
    try {
      // Retrieve the encrypted credential from the server using both username and password
      const serverCredential = await retrieveCredentialFromServer(serverLoginUsername, serverLoginPassword);
      
      if (!serverCredential) {
        log().error?.('No credential found for username/password combination');
        return;
      }
      
      // Derive the key from the password and salt
      const key = await deriveKeyFromPassword(serverLoginPassword, serverCredential.salt);
      
      // Decrypt the credential
      const decryptedCredential = await decryptCredential(
        serverCredential.encryptedCredential,
        key, 
        serverCredential.iv
      );
      
      // Import the decrypted credential
      const imported = await tasks.importEmailCredential({
        description: serverCredential.description,
        encryptedEmailCredential: decryptedCredential
      });
      
      if (!imported.ok) {
        log().error?.('Failed to import email credential from server', imported.value);
        return;
      }
      
      // Activate the user with the imported credential
      const unlocked = await tasks.activateUserWithLocallyStoredEncryptedEmailCredentials({
        localCredentialUuid: imported.value.locallyStoredCredentialUuid,
        password: serverLoginPassword
      });
      
      if (!unlocked.ok) {
        log().error?.('Failed to activate user with imported credential', unlocked.value);
        return;
      }
      
      // Success - update state and navigate
      history.replace('/mail');
      activeLocallyStoredCredentialUuid.set(imported.value.locallyStoredCredentialUuid);
      activeUserId.set(unlocked.value.userId);
      
      // Reset the server login form
      setServerLoginUsername('');
      setServerLoginPassword('');
      setShowServerLogin(false);
      
    } catch (error) {
      log().error?.('Error logging in with server credentials:', error);
    } finally {
      setIsLoggingInWithServer(false);
      busyWith.set(undefined);
    }
  });

  const dismissUnlockAccountMasterPasswordDialog = useRef<() => void>(noop);
  const onOpenAccountButtonClick = useCallbackRef((localCredentialUuid: Uuid) => {
    if (tasks === undefined) {
      return; // Not ready
    }

    dismissUnlockAccountMasterPasswordDialog.current = transientContent.present(({ dismiss }) => (
      <UnlockAccountMasterPasswordDialog
        dismiss={dismiss}
        localCredentialUuid={localCredentialUuid}
        onSubmit={onSubmitUnlockAccountDialog}
      />
    ));
  });

  const onSubmitUnlockAccountDialog = useCallbackRef(
    async ({ localCredentialUuid, masterPassword }: { localCredentialUuid: Uuid; masterPassword: string }) => {
      dismissUnlockAccountMasterPasswordDialog.current();

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

        history.replace('/mail');

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
                
                <ListItemButton 
                  onClick={() => setShowServerLogin(!showServerLogin)} 
                  sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
                >
                  <ListItemText primary={$loginWithUsernamePassword(t)} slotProps={emphasizedListItemButtonTextSlotProps} />
                  <ListItemIcon sx={{ minWidth: 0 }}>
                    <LockOpen color="primary" />
                  </ListItemIcon>
                </ListItemButton>
                
                {showServerLogin && (
                  <ListItem sx={{ flexDirection: 'column', p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Stack width="100%" spacing={2}>
                      <TextField
                        label={$username(t)}
                        value={serverLoginUsername}
                        onChange={(e) => setServerLoginUsername(e.target.value)}
                        fullWidth
                        margin="dense"
                        variant="outlined"
                        disabled={isLoggingInWithServer}
                      />
                      <TextField
                        label={$password(t)}
                        type="password"
                        value={serverLoginPassword}
                        onChange={(e) => setServerLoginPassword(e.target.value)}
                        fullWidth
                        margin="dense"
                        variant="outlined"
                        disabled={isLoggingInWithServer}
                      />
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleServerLogin}
                        disabled={!serverLoginUsername || !serverLoginPassword || isLoggingInWithServer}
                        fullWidth
                        sx={{ mt: 1 }}
                      >
                        {isLoggingInWithServer ? <CircularProgress size={24} /> : $login(t)}
                      </Button>
                    </Stack>
                  </ListItem>
                )}

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
