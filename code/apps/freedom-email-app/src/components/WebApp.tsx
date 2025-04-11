import { Box, CssBaseline } from '@mui/material';
import { log } from 'freedom-async';
import { makeUuid } from 'freedom-contexts';
import { useMemo } from 'react';
import { useBindingEffect } from 'react-bindings';

import { useActiveUserId } from '../contexts/active-user-id.tsx';
import { useSideMenuWidth } from '../contexts/side-menu-width.tsx';
import { TasksProvider, useTasks } from '../contexts/tasks.tsx';
import { TARGET_FPS_MSEC } from '../modules/virtual-list/consts/animation.ts';
import { AppGlobalStyles } from './AppGlobalStyles.tsx';
import { AppMainContent } from './AppMainContent.tsx';
import { AppNavbar } from './AppNavbar.tsx';
import { AppTheme } from './AppTheme.tsx';
import { SideMenu } from './SideMenu.tsx';

export const WebApp = () => (
  <TasksProvider>
    <AppTheme>
      <AppGlobalStyles />
      <CssBaseline enableColorScheme={true} />
      <BootstrappedWebApp />
    </AppTheme>
  </TasksProvider>
);

// Helpers

const BootstrappedWebApp = () => {
  const activeUserId = useActiveUserId();
  const uuid = useMemo(() => makeUuid(), []);
  const sideMenuWidth = useSideMenuWidth();
  const tasks = useTasks();

  useBindingEffect(
    activeUserId,
    async (activeUserId) => {
      if (tasks === undefined || activeUserId === undefined) {
        return; // Not ready
      }

      const startedSyncService = await tasks.startSyncService();
      if (!startedSyncService.ok) {
        log().error?.('Failed to start sync service', startedSyncService.value);
        return;
      }
    },
    { deps: [tasks] }
  );

  useBindingEffect(
    sideMenuWidth,
    (sideMenuWidth) => {
      const elem = document.getElementById(`${uuid}-main-content-offset`);
      if (elem === null) {
        return;
      }

      elem.style.paddingLeft = `${sideMenuWidth}px`;
    },
    { limitMSec: TARGET_FPS_MSEC }
  );

  return (
    <>
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
          <AppMainContent scrollParent={`${uuid}-main`} />
        </Box>
      </Box>
    </>
  );
};
