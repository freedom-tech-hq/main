import { Stack } from '@mui/material';
import { base64String } from 'freedom-basic-data';
import { log, makeUuid } from 'freedom-contexts';
import type { LocallyStoredEncryptedEmailCredentialInfo } from 'freedom-email-tasks-web-worker';
import { useMemo } from 'react';
import { BC, useBinding, useCallbackRef } from 'react-bindings';

import { useTasks } from '../../../../contexts/tasks.tsx';
import { AuthSelectionPanel } from './AuthSelectionPanel.tsx';
import { CreateNewAccountPanel } from './CreateNewAccountPanel.tsx';
import { ImportCredentialPanel } from './ImportCredentialPanel.tsx';
import { LocalSignInPanel } from './LocalSignInPanel.tsx';
import { SignInWithRemotePanel } from './SignInWithRemotePanel.tsx';

type PanelState = 'selection' | 'createNewAccount' | 'importCredential' | 'signInLocally' | 'signInWithRemote';

export const AuthPanel = () => {
  const tasks = useTasks();
  const uuid = useMemo(() => makeUuid(), []);

  const panelState = useBinding<PanelState>(() => 'selection', { id: 'panelState', detectChanges: true });

  const selectedAccount = useBinding<LocallyStoredEncryptedEmailCredentialInfo | undefined>(() => undefined, { id: 'selectedAccount' });

  const onAccountClick = useCallbackRef((account: LocallyStoredEncryptedEmailCredentialInfo) => {
    selectedAccount.set(account);
    panelState.set('signInLocally');
  });

  const onCreateNewAccountClick = useCallbackRef(() => {
    panelState.set('createNewAccount');
  });

  const onImportCredentialClick = useCallbackRef(() => {
    const elem = document.getElementById(`${uuid}-credential-file-input`);
    if (elem === null) {
      return;
    }

    elem.click();
  });

  const onSignInWithRemoteClick = useCallbackRef(() => {
    panelState.set('signInWithRemote');
  });

  const resetPanelState = useCallbackRef(() => {
    panelState.set('selection');
    selectedAccount.set(undefined);
  });

  const removeImportedAccountAndResetPanelState = useCallbackRef(async () => {
    const removed = await tasks!.removeLocallyStoredEncryptedEmailCredential(selectedAccount.get()!.localUuid);
    if (!removed.ok) {
      log().error?.('Failed to remove imported email credential', removed.value);
    }

    resetPanelState();
  });

  const onCredentialFileChange = useCallbackRef(() => {
    if (tasks === undefined) {
      return; // Not ready
    }

    const elem = document.getElementById(`${uuid}-credential-file-input`);
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

      // TODO: should have a better name here
      const imported = await tasks.importEmailCredential({
        description: `Imported - ${new Date().toISOString()}`,
        encryptedEmailCredential
      });
      if (!imported.ok) {
        log().error?.('Failed to import email credential', imported.value);
        return;
      }

      const locallyStoredEncryptedEmailCredentials = await tasks.listLocallyStoredEncryptedEmailCredentials();
      if (!locallyStoredEncryptedEmailCredentials.ok) {
        log().error?.('Failed to read local email credential', locallyStoredEncryptedEmailCredentials.value);
        return;
      }

      const importedAccount = locallyStoredEncryptedEmailCredentials.value.find(
        (cred) => cred.localUuid === imported.value.locallyStoredCredentialUuid
      );
      if (importedAccount === undefined) {
        log().error?.('Failed to import email credential');
        return;
      }

      selectedAccount.set(importedAccount);
      panelState.set('importCredential');
    };
    reader.readAsText(firstFile);
  });

  return (
    <Stack alignItems="center" justifyContent="center" sx={{ flex: 1 }}>
      <input
        id={`${uuid}-credential-file-input`}
        type="file"
        accept=".credential"
        onChange={onCredentialFileChange}
        style={{ display: 'none' }}
      />

      {BC(panelState, (panelState) => {
        switch (panelState) {
          case 'selection':
            return (
              <AuthSelectionPanel
                onAccountClick={onAccountClick}
                onCreateNewAccountClick={onCreateNewAccountClick}
                onImportCredentialClick={onImportCredentialClick}
                onSignInWithRemoteClick={onSignInWithRemoteClick}
              />
            );
          case 'createNewAccount':
            return <CreateNewAccountPanel onBackClick={resetPanelState} />;
          case 'importCredential':
            return <ImportCredentialPanel account={selectedAccount.get()!} onBackClick={removeImportedAccountAndResetPanelState} />;
          case 'signInLocally':
            return <LocalSignInPanel account={selectedAccount.get()!} onBackClick={resetPanelState} />;
          case 'signInWithRemote':
            return <SignInWithRemotePanel onBackClick={resetPanelState} />;
        }
      })}
    </Stack>
  );
};
