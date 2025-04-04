import { Box, CssBaseline } from '@mui/material';
import { inline } from 'freedom-async';
import { makeUuid } from 'freedom-contexts';
import { Fragment, useEffect, useMemo } from 'react';
import { BC, useBinding, useBindingEffect, useDerivedBinding } from 'react-bindings';

import { useSelectedMailThreadId } from '../contexts/selected-mail-thread.tsx';
import { useSideMenuWidth } from '../contexts/side-menu-width.tsx';
import { TasksProvider, useTasks } from '../contexts/tasks.tsx';
import { MailThread } from '../modules/mail-thread/components/MailThread.tsx';
import { TARGET_FPS_MSEC } from '../modules/virtual-list/consts/animation.ts';
import type { EmailUserId } from '../types/EmailUserId.ts';
import { AppGlobalStyles } from './AppGlobalStyles.tsx';
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
  const sideMenuWidth = useSideMenuWidth();
  const selectedMailThreadId = useSelectedMailThreadId();
  const tasks = useTasks();

  const activeUserId = useBinding<EmailUserId | undefined>(() => undefined, { id: 'activeUserId', detectChanges: true });

  const hasSelectedMailThreadId = useDerivedBinding(selectedMailThreadId, (selectedThreadId) => selectedThreadId !== undefined, {
    id: 'hasSelectedMailThreadId'
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

  useEffect(() => {
    if (tasks === undefined) {
      return;
    }

    inline(async () => {
      const created = await tasks.createUser();
      if (!created.ok) {
        console.error('Failed to create user', created.value);
        return;
      }

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
      {BC(activeUserId, (activeUserId) => (
        <Fragment key={activeUserId ?? ''}>
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
        </Fragment>
      ))}
    </>
  );
};
