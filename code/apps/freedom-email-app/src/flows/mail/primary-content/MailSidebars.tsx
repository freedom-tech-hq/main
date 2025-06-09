import { Drawer, Stack } from '@mui/material';
import { IF } from 'freedom-logical-web-components';
import React from 'react';
import { BC, useCallbackRef } from 'react-bindings';

import { useMailScreen } from '../../../contexts/mail-screen.tsx';
import { useIsSizeClass } from '../../../hooks/useIsSizeClass.ts';
import { PrimaryMailSidebar } from './PrimaryMailSidebar.tsx';
import { SecondaryMailSidebar } from './SecondaryMailSidebar.tsx';

export const MailSidebars = () => {
  const mailScreen = useMailScreen();
  const isXlOrLarger = useIsSizeClass('>=', 'xl');
  const isLgOrLarger = useIsSizeClass('>=', 'lg');
  const isLgOrSmaller = useIsSizeClass('<=', 'lg');

  const lgOrLargerFixedContent = (
    <Stack direction="row" alignItems="stretch" className="h-dvh">
      {IF(isXlOrLarger, () => (
        <PrimaryMailSidebar />
      ))}
      <SecondaryMailSidebar />
    </Stack>
  );

  const lgOrSmallerDrawerContent = (
    <Stack direction="row" alignItems="stretch" className="h-dvh">
      <PrimaryMailSidebar />
    </Stack>
  );

  const hidePrimarySidebar = useCallbackRef(() => mailScreen.showPrimarySidebar.set(false));

  return (
    <>
      {IF(isLgOrSmaller, () =>
        BC(mailScreen.showPrimarySidebar, (show) => (
          <Drawer variant="persistent" open={show} onClose={hidePrimarySidebar}>
            {lgOrSmallerDrawerContent}
          </Drawer>
        ))
      )}
      {IF(isLgOrLarger, () => lgOrLargerFixedContent)}
    </>
  );
};
