import { ArrowForwardIosOutlined, DownloadForOfflineOutlined as DownloadIcon, Fingerprint } from '@mui/icons-material';
import type { ListItemTextSlotsAndSlotProps } from '@mui/material';
import { CircularProgress, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper, Typography } from '@mui/material';
import { bestEffort } from 'freedom-async';
import { base64String, type Uuid } from 'freedom-basic-data';
import { log, makeTrace, makeUuid } from 'freedom-contexts';
import type {
  LocallyStoredEncryptedEmailCredentialInfo,
  LocallyStoredEncryptedEmailCredentialPasswordType
} from 'freedom-email-tasks-web-worker';
import { LOCALIZE } from 'freedom-localization';
import { ELSE, IF } from 'freedom-logical-web-components';
import { useT } from 'freedom-react-localization';
import { useHistory } from 'freedom-web-navigation';
import { noop } from 'lodash-es';
import { useEffect, useMemo, useRef } from 'react';
import { useBinding, useCallbackRef } from 'react-bindings';
import { useDerivedWaitable, WC } from 'react-waitables';

import { useActiveLocallyStoredCredentialUuid } from '../contexts/active-locally-stored-credential-uuid.tsx';
import { useActiveUserId } from '../contexts/active-user-id.tsx';
import { useTasks } from '../contexts/tasks.tsx';
import { useTransientContent } from '../contexts/transient-content.tsx';
import { useAppTheme } from '../contexts/useAppTheme.tsx';
import { useTaskWaitable } from '../hooks/useTaskWaitable.ts';
import { getTaskWorkerConfig } from '../task-worker-configs/configs.ts';
import { makeBrowserDownloadLocallyStoredEncryptedEmailCredential } from '../utils/makeBrowserDownloadLocallyStoredEncryptedEmailCredential.ts';
import { registerWebAuthnCredential } from '../utils/webauthn/registerWebAuthnCredential.ts';
import { LoginFromServerDialog } from './auth/LoginFromServerDialog.tsx';
import { NewAccountEmailAndMasterPasswordDialog } from './auth/NewAccountEmailAndMasterPasswordDialog.tsx';
import { UnlockAccountMasterPasswordDialog } from './auth/UnlockAccountMasterPasswordDialog.tsx';
import { ConfirmationDialog } from './ConfirmationDialog.tsx';

const ns = 'ui';
const $accounts = LOCALIZE('Accounts')({ ns });
const $addBiometricsTitle = LOCALIZE('Secure with Biometrics?')({ ns });
const $addBiometricsMessage = LOCALIZE(
  "For your convenience, your device's biometrics capabilities (ex. Touch ID) may be used to unlock your account.  Would you like to setup biometric security now?"
)({ ns });
const $downloadCredentialTitle = LOCALIZE('Save Credential')({ ns });
const $downloadCredentialMessage = LOCALIZE(
  "You've opted not to backup your encrypted credential on our servers.  You can export your credential later, but you recommend saving it now, and keeping it somewhere safe.  You'll always need your master password to decrypt it.  Would you like to save your recovery file now?"
)({ ns });
const $importCredential = LOCALIZE('Import Credential')({ ns });
const $newAccount = LOCALIZE('New Account')({ ns });
const $untitled = LOCALIZE('untitled')({ ns });
const $useAnotherAccount = LOCALIZE('Use Another Account')({ ns });

export const AccountCreationOrLogin = () => {
  const activeLocallyStoredCredentialUuid = useActiveLocallyStoredCredentialUuid();
  const activeUserId = useActiveUserId();
  const history = useHistory();
  const t = useT();
  const tasks = useTasks();
  const theme = useAppTheme();
  const transientContent = useTransientContent();
  const uuid = useMemo(() => makeUuid(), []);

  const isBusy = useBinding<boolean>(() => false, { id: 'isBusy', detectChanges: true });

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

  const dismissLoginDialog = useRef<() => void>(noop);

  const onLoginFromServerButtonClick = useCallbackRef(() => {
    if (tasks === undefined) {
      return; // Not ready
    }

    dismissLoginDialog.current();
    dismissLoginDialog.current = transientContent.present(({ dismiss }) => (
      <LoginFromServerDialog dismiss={dismiss} onSubmit={onSubmitUnlockAccountDialog} />
    ));
  });

  const dismissNewAccountDialog = useRef<() => void>(noop);
  const onNewAccountButtonClick = useCallbackRef(() => {
    if (tasks === undefined) {
      return; // Not ready
    }

    dismissNewAccountDialog.current();
    dismissNewAccountDialog.current = transientContent.present(({ dismiss }) => (
      <NewAccountEmailAndMasterPasswordDialog dismiss={dismiss} onSubmit={onSubmitNewAccountDialog} />
    ));
  });

  const onExportCredentialClick = useCallbackRef(async () => {
    if (tasks === undefined) {
      console.error('Tasks not ready');
      return; // Not ready
    }

    const credentialUuid = activeLocallyStoredCredentialUuid.get();
    if (credentialUuid === undefined) {
      console.error('No active credential UUID');
      return; // Not ready
    }

    const trace = makeTrace(import.meta.filename, 'onExportCredentialClick');
    await bestEffort(trace, makeBrowserDownloadLocallyStoredEncryptedEmailCredential(trace, { tasks, credentialUuid }));
  });

  const onSubmitNewAccountDialog = useCallbackRef(
    async ({
      emailUsername,
      masterPassword,
      saveCredentialsOnRemote
    }: {
      emailUsername: string;
      masterPassword: string;
      saveCredentialsOnRemote: boolean;
    }) => {
      if (isBusy.get()) {
        return;
      }

      dismissNewAccountDialog.current();

      isBusy.set(true);
      try {
        const created = await tasks!.createUser({ emailUsername, masterPassword, saveCredentialsOnRemote });
        if (!created.ok) {
          // TODO: better error visibility
          log().error?.('Failed to create user', created.value);
          return;
        }

        history.replace('/mail');

        activeLocallyStoredCredentialUuid.set(created.value.locallyStoredCredentialUuid);
        activeUserId.set(created.value.userId);

        if (!saveCredentialsOnRemote) {
          transientContent.present(({ dismiss }) => (
            <ConfirmationDialog
              dismiss={dismiss}
              titleIcon={<DownloadIcon color="primary" fontSize="large" />}
              title={$downloadCredentialTitle(t)}
              message={$downloadCredentialMessage(t)}
              onConfirm={async () => {
                dismiss();
                await onExportCredentialClick();
              }}
            />
          ));
        } else if (created.value.locallyStoredCredentialUuid !== undefined) {
          const email = `${emailUsername}@${getTaskWorkerConfig().defaultEmailDomain}`;

          transientContent.present(({ dismiss }) => (
            <ConfirmationDialog
              dismiss={dismiss}
              titleIcon={<Fingerprint color="primary" fontSize="large" />}
              title={$addBiometricsTitle(t)}
              message={$addBiometricsMessage(t)}
              onConfirm={() => {
                dismiss();
                onSetupBiometricsConfirmation({
                  localCredentialUuid: created.value.locallyStoredCredentialUuid!,
                  description: email,
                  password: masterPassword
                });
              }}
            />
          ));
        }
      } finally {
        isBusy.set(false);
      }
    }
  );

  const onOpenAccountButtonClick = useCallbackRef((credentialInfo: LocallyStoredEncryptedEmailCredentialInfo) => {
    if (tasks === undefined) {
      return; // Not ready
    }

    dismissLoginDialog.current();
    dismissLoginDialog.current = transientContent.present(({ dismiss }) => (
      <UnlockAccountMasterPasswordDialog dismiss={dismiss} credentialInfo={credentialInfo} onSubmit={onSubmitUnlockAccountDialog} />
    ));
  });

  const onSubmitUnlockAccountDialog = useCallbackRef(
    async ({
      localCredentialUuid,
      description,
      password,
      passwordType
    }: {
      localCredentialUuid: Uuid;
      description: string;
      password: string;
      passwordType: LocallyStoredEncryptedEmailCredentialPasswordType;
    }) => {
      if (tasks === undefined || isBusy.get()) {
        return;
      }

      dismissLoginDialog.current();

      isBusy.set(true);
      try {
        const unlocked = await tasks!.activateUserWithLocallyStoredEncryptedEmailCredentials({
          localCredentialUuid,
          password,
          passwordType
        });
        if (!unlocked.ok) {
          // TODO: better error visibility
          log().error?.('Failed to activate user', unlocked.value);
          return;
        }

        history.replace('/mail');

        activeLocallyStoredCredentialUuid.set(localCredentialUuid);
        activeUserId.set(unlocked.value.userId);

        // After successful unlock using a master password, try to register a WebAuthn credential
        if (passwordType === 'master' && window.PublicKeyCredential !== undefined) {
          transientContent.present(({ dismiss }) => (
            <ConfirmationDialog
              dismiss={dismiss}
              titleIcon={<Fingerprint color="primary" fontSize="large" />}
              title={$addBiometricsTitle(t)}
              message={$addBiometricsMessage(t)}
              onConfirm={() => {
                dismiss();
                onSetupBiometricsConfirmation({ localCredentialUuid, description, password });
              }}
            />
          ));
        }
      } finally {
        isBusy.set(false);
      }
    }
  );

  const onSetupBiometricsConfirmation = useCallbackRef(
    async ({ localCredentialUuid, description, password }: { localCredentialUuid: Uuid; description: string; password: string }) => {
      if (tasks === undefined) {
        return;
      }

      isBusy.set(true);
      try {
        const trace = makeTrace(import.meta.filename, 'onSubmitUnlockAccountDialog');

        // Removing any previous registrations.  That way, if the user cancels, we don't leave any unexpected registrations.
        await bestEffort(trace, tasks.removeEncryptionForBiometricsFromLocallyStoredEmailCredential({ localCredentialUuid }));

        // Registering the WebAuthn credential with the system
        const biometricPassword = await registerWebAuthnCredential(trace, { localCredentialUuid, description });
        if (!biometricPassword.ok) {
          log().error?.('Failed to register WebAuthn credential', biometricPassword.value);
          return;
        }

        // Using the generated password to encrypt the master password
        await bestEffort(
          trace,
          tasks.addEncryptionForBiometricsToLocallyStoredEmailCredential({
            localCredentialUuid,
            password,
            biometricPassword: biometricPassword.value
          })
        );
      } finally {
        isBusy.set(false);
      }
    }
  );

  return (
    <>
      <input id={`${uuid}-file-input`} type="file" accept=".credential" onChange={onFileChange} style={{ display: 'none' }} />

      {IF(
        isBusy,
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
                {WC(locallyStoredCredentialInfo, (locallyStoredCredentialInfo) =>
                  IF(hasLocallyStoredCredentials, () =>
                    locallyStoredCredentialInfo.map((credentialInfo) => (
                      <ListItemButton key={credentialInfo.localUuid} onClick={() => onOpenAccountButtonClick(credentialInfo)}>
                        <ListItemText primary={credentialInfo.description ?? $untitled(t)} />
                        <ListItemIcon sx={{ minWidth: 0 }}>
                          <ArrowForwardIosOutlined color="disabled" />
                        </ListItemIcon>
                      </ListItemButton>
                    ))
                  )
                )}

                <ListItemButton onClick={onImportCredentialButtonClick} sx={{ borderTop: `1px solid ${theme.palette.divider}` }}>
                  <ListItemText primary={$importCredential(t)} slotProps={emphasizedListItemButtonTextSlotProps} />
                </ListItemButton>

                <ListItemButton onClick={onLoginFromServerButtonClick} sx={{ borderTop: `1px solid ${theme.palette.divider}` }}>
                  <ListItemText primary={$useAnotherAccount(t)} slotProps={emphasizedListItemButtonTextSlotProps} />
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
