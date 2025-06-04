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
              <Stack direction="row" alignItems="stretch" sx={{ width: '100%', height: '100dvh', minHeight: '650px' }}>
                <AuthHeroSidebar />
                <Stack alignItems="center" justifyContent="center" sx={{ flex: 1, px: 2, py: 5 }}>
                  <AuthSelection showLogo={false} />
                </Stack>
              </Stack>
            );

          case 'md':
            return (
              <Stack>
                <AuthHeroBanner />
                <Stack sx={{ minHeight: '64px', backgroundColor: 'red' }}></Stack>
              </Stack>
            );

          case 'sm':
          case 'xs':
            return <></>;
        }
      })}
    </>
  );
};
