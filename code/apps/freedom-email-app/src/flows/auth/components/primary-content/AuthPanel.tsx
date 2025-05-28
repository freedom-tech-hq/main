import { Stack } from '@mui/material';
import type { LocallyStoredEncryptedEmailCredentialInfo } from 'freedom-email-tasks-web-worker';
import { BC, useBinding, useCallbackRef } from 'react-bindings';

import { AuthSelectionPanel } from './AuthSelectionPanel.tsx';
import { CreateNewAccountPanel } from './CreateNewAccountPanel.tsx';
import { LocalSignInPanel } from './LocalSignInPanel.tsx';

type PanelState = 'selection' | 'createNewAccount' | 'importCredential' | 'signInLocally' | 'signInWithRemote';

export const AuthPanel = () => {
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
    console.log('onImportCredentialClick');
  });

  const onSignInWithRemoteClick = useCallbackRef(() => {
    console.log('onSignInWithRemoteClick');
  });

  const resetPanelState = useCallbackRef(() => {
    panelState.set('selection');
    selectedAccount.set(undefined);
  });

  return (
    <Stack alignItems="center" justifyContent="center" sx={{ flex: 1 }}>
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
            // TODO: TEMP
            return <></>;
          case 'signInLocally':
            return <LocalSignInPanel account={selectedAccount.get()!} onBackClick={resetPanelState} />;
          case 'signInWithRemote':
            // TODO: TEMP
            return <></>;
        }
      })}
    </Stack>
  );
};
