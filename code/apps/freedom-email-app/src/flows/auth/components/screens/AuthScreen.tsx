import { Stack } from '@mui/material';
import React, { useEffect } from 'react';
import { BC } from 'react-bindings';

import { type AuthScreenMode, useAuthScreenMode } from '../../../../contexts/auth-screen-mode.tsx';
import { useSelectedAuthEmail } from '../../../../contexts/selected-auth-email.tsx';
import { useSizeClass } from '../../../../hooks/useSizeClass.ts';
import { AuthHeroBanner } from '../heros/AuthHeroBanner.tsx';
import { AuthHeroSidebar } from '../heros/AuthHeroSidebar.tsx';
import { AuthPanel } from '../primary-content/AuthPanel.tsx';

export interface AuthScreenProps {
  mode?: AuthScreenMode;
  email?: string;
}

export const AuthScreen = ({ mode, email }: AuthScreenProps) => {
  const authScreenMode = useAuthScreenMode();
  const selectedEmail = useSelectedAuthEmail();
  const sizeClass = useSizeClass();

  useEffect(() => {
    authScreenMode.set(mode);

    switch (mode) {
      case 'import-credential':
      case 'sign-in':
        selectedEmail.set(email);
        break;

      case undefined:
      case 'add-account':
      case 'new-account':
        // email is always undefined in these modes, so we don't set it
        break;
    }
  }, [authScreenMode, email, mode, selectedEmail]);

  return BC(sizeClass, (sizeClass) => {
    switch (sizeClass) {
      case 'xl':
      case 'lg':
        return (
          <Stack direction="row" alignItems="stretch" className="w-full min-h-dvh">
            <AuthHeroSidebar />
            <AuthPanel />
          </Stack>
        );

      case 'md':
        return (
          <Stack className="min-h-dvh">
            <AuthHeroBanner />
            <AuthPanel />
          </Stack>
        );

      case 'sm':
      case 'xs':
        return (
          <Stack className="min-h-dvh">
            <AuthPanel />
          </Stack>
        );
    }
  });
};
