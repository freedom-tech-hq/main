import { Stack } from '@mui/material';
import { useHistory } from 'freedom-web-navigation';
import React from 'react';
import { BC } from 'react-bindings';

import { appRoot } from '../../../../components/routing/appRoot.tsx';
import { useAuthScreenMode } from '../../../../contexts/auth-screen-mode.tsx';
import { useSelectedAuthEmail } from '../../../../contexts/selected-auth-email.tsx';
import { AuthSelectionPanel } from './AuthSelectionPanel.tsx';
import { CreateNewAccountPanel } from './CreateNewAccountPanel.tsx';
import { ImportCredentialPanel } from './ImportCredentialPanel.tsx';
import { LocalSignInPanel } from './LocalSignInPanel.tsx';
import { SignInWithRemotePanel } from './SignInWithRemotePanel.tsx';

export const AuthPanel = () => {
  const authScreenMode = useAuthScreenMode();
  const selectedEmail = useSelectedAuthEmail();
  const history = useHistory();

  return (
    <Stack justifyContent="center" alignItems="stretch" className="flex-auto">
      {BC(authScreenMode, (mode) => {
        switch (mode) {
          case undefined:
            return <AuthSelectionPanel />;

          case 'new-account':
            return <CreateNewAccountPanel />;

          case 'import-credential': {
            const email = selectedEmail.get();
            if (email === undefined) {
              history.replace(appRoot.path.value);
              return null;
            }

            return <ImportCredentialPanel email={email} />;
          }

          case 'sign-in': {
            const email = selectedEmail.get();
            if (email === undefined) {
              history.replace(appRoot.path.value);
              return null;
            }

            return <LocalSignInPanel email={email} />;
          }

          case 'add-account':
            return <SignInWithRemotePanel />;
        }
      })}
    </Stack>
  );
};
