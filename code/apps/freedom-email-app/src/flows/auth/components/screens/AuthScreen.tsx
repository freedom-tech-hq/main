import { Stack } from '@mui/material';
import { BC } from 'react-bindings';

import { useSizeClass } from '../../../../hooks/useSizeClass.ts';
import { AuthHeroBanner } from '../heros/AuthHeroBanner.tsx';
import { AuthHeroSidebar } from '../heros/AuthHeroSidebar.tsx';
import { AuthSelection } from '../primary-content/AuthSelection.tsx';

export const AuthScreen = () => {
  const sizeClass = useSizeClass();

  return (
    <>
      {BC(sizeClass, (sizeClass) => {
        switch (sizeClass) {
          case 'xl':
          case 'lg':
            return (
              <Stack direction="row" alignItems="stretch" sx={{ width: '100%', minHeight: '100dvh' }}>
                <AuthHeroSidebar />
                <Stack alignItems="center" justifyContent="center" sx={{ flex: 1, px: 3, py: 5 }}>
                  <AuthSelection showLogo={false} />
                </Stack>
              </Stack>
            );

          case 'md':
            return (
              <Stack sx={{ minHeight: '100dvh' }}>
                <AuthHeroBanner />
                <Stack alignItems="center" justifyContent="center" sx={{ flex: 1, px: 2, py: 5 }}>
                  <AuthSelection showLogo={false} />
                </Stack>
              </Stack>
            );

          case 'sm':
          case 'xs':
            return (
              <Stack alignItems="center" justifyContent="center" sx={{ flex: 1, px: 2, py: 5, minHeight: '100dvh' }}>
                <AuthSelection showLogo={true} />
              </Stack>
            );
        }
      })}
    </>
  );
};
