import { Box, CssBaseline } from '@mui/material';
import { proxy } from 'comlink';
import type { Uuid } from 'freedom-basic-data';
import { log, makeUuid } from 'freedom-contexts';
import { TARGET_FPS_MSEC } from 'freedom-web-animation';
import { HistoryProvider, useCreateBrowserHistory } from 'freedom-web-navigation';
import { VirtualListThemeProvider } from 'freedom-web-virtual-list';
import { useEffect, useMemo, useRef } from 'react';
import { useBindingEffect } from 'react-bindings';

import { useActiveUserId } from '../contexts/active-user-id.tsx';
import { useSideMenuWidth } from '../contexts/side-menu-width.tsx';
import { TasksProvider, useTasks } from '../contexts/tasks.tsx';
import { TransientContentProvider } from '../contexts/transient-content.tsx';
import { AppMainContent } from './AppMainContent.tsx';
import { AppNavbar } from './AppNavbar.tsx';
import { AppThemeProvider } from './AppTheme.tsx';
import { SideMenu } from './SideMenu.tsx';

export const WebApp = () => {
  const history = useCreateBrowserHistory();

  return (
    <HistoryProvider history={history}>
      <TasksProvider>
        <AppThemeProvider>
          <VirtualListThemeProvider>
            <CssBaseline enableColorScheme={true} />
            <BootstrappedWebApp />
          </VirtualListThemeProvider>
        </AppThemeProvider>
      </TasksProvider>
    </HistoryProvider>
  );
};

// Helpers

const BootstrappedWebApp = () => {
  const activeUserId = useActiveUserId();
  const uuid = useMemo(() => makeUuid(), []);
  const sideMenuWidth = useSideMenuWidth();
  const tasks = useTasks();
  const lastSyncServiceUuid = useRef<Uuid | undefined>(undefined);

  useBindingEffect(
    activeUserId,
    async (activeUserId) => {
      if (tasks === undefined || activeUserId === undefined) {
        return; // Not ready
      }

      lastSyncServiceUuid.current = makeUuid();
      const mySyncServiceUuid = lastSyncServiceUuid.current;
      const isConnected = proxy(() => mySyncServiceUuid === lastSyncServiceUuid.current);

      const startedSyncService = await tasks.startSyncService(isConnected);
      if (!startedSyncService.ok) {
        log().error?.('Failed to start sync service', startedSyncService.value);
        return;
      }
    },
    { deps: [tasks], triggerOnMount: true }
  );

  useEffect(() => () => {
    lastSyncServiceUuid.current = undefined;
  });

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
    <TransientContentProvider>
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
    </TransientContentProvider>
  );
};
