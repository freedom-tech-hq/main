import { Stack } from '@mui/material';
import React from 'react';
import { BC } from 'react-bindings';

import { useSizeClass } from '../../../../hooks/useSizeClass.ts';
import { AuthHeroBanner } from '../heros/AuthHeroBanner.tsx';
import { AuthHeroSidebar } from '../heros/AuthHeroSidebar.tsx';
import { AuthPanel } from '../primary-content/AuthPanel.tsx';

export const AuthScreen = () => {
  const sizeClass = useSizeClass();

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
