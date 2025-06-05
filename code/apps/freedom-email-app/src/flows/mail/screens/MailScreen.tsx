import { Stack } from '@mui/material';
import React from 'react';
import { BC } from 'react-bindings';

import { useSizeClass } from '../../../hooks/useSizeClass.ts';
import { MailDetailPanel } from '../primary-content/MailDetailPanel.tsx';
import { MailSidebars } from '../primary-content/MailSidebars.tsx';

export const MailScreen = () => {
  const sizeClass = useSizeClass();

  return BC(sizeClass, (sizeClass) => {
    switch (sizeClass) {
      case 'xl':
      case 'lg':
      case 'md':
      case 'sm':
      case 'xs':
        // TODO: TEMP (md,sm,xs shouldnt be here)
        return (
          <Stack direction="row" alignItems="stretch" className="w-full h-dvh">
            <MailSidebars />
            <MailDetailPanel />
          </Stack>
        );

      //   case 'md':
      //     return (
      //       <Stack className="min-h-dvh">
      //         <AuthHeroBanner />
      //         <AuthPanel />
      //       </Stack>
      //     );

      //   case 'sm':
      //   case 'xs':
      //     return (
      //       <Stack className="min-h-dvh">
      //         <AuthPanel />
      //       </Stack>
      //     );
    }
  });
};
