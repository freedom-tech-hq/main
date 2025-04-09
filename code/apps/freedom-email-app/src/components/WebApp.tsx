import { Box, CssBaseline } from '@mui/material';
import { inline } from 'freedom-async';
import { makeUuid } from 'freedom-contexts';
import { useEffect, useMemo } from 'react';
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
  const uuid = useMemo(() => makeUuid(), []);
  const activeUserId = useActiveUserId();
  const sideMenuWidth = useSideMenuWidth();
  const tasks = useTasks();

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

  useEffect(() => {
    if (tasks === undefined) {
      return;
    }

    inline(async () => {
      // TODO: TEMP password
      const created = await tasks.createUser({ password: 'hello world' });
      if (!created.ok) {
        console.error('Failed to create user', created.value);
        return;
      }

      // TODO: make sure the user saves these somewhere
      console.log('FOOBARBLA userId', created.value.userId);
      console.log('FOOBARBLA encryptedUserAuthPackage', created.value.encryptedUserAuthPackage);

      const startedSyncService = await tasks.startSyncServiceForUser({ userId: created.value.userId });
      if (!startedSyncService.ok) {
        console.error('Failed to start sync service', startedSyncService.value);
        return;
      }

      console.log('Sync service started for user', created.value.userId);

      // TODO: TEMP
      activeUserId.set(created.value.userId);
    });
  });

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
          <AppMainContent />
        </Box>
      </Box>
    </>
  );
};
