import { Box, CssBaseline } from '@mui/material';
import { makeUuid } from 'freedom-contexts';
import { useMemo } from 'react';
import { BC, useBindingEffect, useDerivedBinding } from 'react-bindings';

import { useSelectedMailThreadId } from '../contexts/selected-mail-thread.tsx';
import { useSideMenuWidth } from '../contexts/side-menu-width.tsx';
import { TasksProvider } from '../contexts/tasks.tsx';
import { MailThread } from '../modules/mail-thread/components/MailThread.tsx';
import { AppGlobalStyles } from './AppGlobalStyles.tsx';
import { AppNavbar } from './AppNavbar.tsx';
import { AppTheme } from './AppTheme.tsx';
import { SideMenu } from './SideMenu.tsx';

export const WebApp = () => {
  const uuid = useMemo(() => makeUuid(), []);
  const sideMenuWidth = useSideMenuWidth();
  const selectedMailThreadId = useSelectedMailThreadId();

  const hasSelectedMailThreadId = useDerivedBinding(selectedMailThreadId, (selectedThreadId) => selectedThreadId !== undefined, {
    id: 'hasSelectedMailThreadId'
  });

  useBindingEffect(sideMenuWidth, (sideMenuWidth) => {
    const elem = document.getElementById(`${uuid}-main-content-offset`);
    if (elem === null) {
      return;
    }

    elem.style.paddingLeft = `${sideMenuWidth}px`;
  });

  return (
    <TasksProvider>
      <AppTheme>
        <AppGlobalStyles />
        <CssBaseline enableColorScheme={true} />
        <AppNavbar />
        <SideMenu />
        <Box
          id={`${uuid}-main-content-offset`}
          sx={{
            pl: `${sideMenuWidth.get()}px`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch'
          }}
        >
          {/* Main content */}
          <Box id={`${uuid}-main`} component="main" sx={{ flexGrow: 1, overflow: 'auto' }}>
            {BC(hasSelectedMailThreadId, (hasSelectedThreadId) =>
              hasSelectedThreadId ? <MailThread scrollParent={`${uuid}-main`} /> : null
            )}
          </Box>
        </Box>
      </AppTheme>
    </TasksProvider>
  );
};
