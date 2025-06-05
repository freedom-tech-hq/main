import { HistoryProvider, useCreateBrowserHistory } from 'freedom-web-navigation';
import React from 'react';

import { TasksProvider } from '../../contexts/tasks.tsx';
import { TransientContentProvider } from '../../contexts/transient-content.tsx';
import { AppRouter } from '../routing/AppRouter.tsx';
import { AppThemeProvider } from './AppTheme.tsx';

export const WebApp = () => {
  const history = useCreateBrowserHistory();

  return (
    <HistoryProvider history={history}>
      <TasksProvider>
        <AppThemeProvider>
          <TransientContentProvider>
            <AppRouter />
          </TransientContentProvider>
        </AppThemeProvider>
      </TasksProvider>
    </HistoryProvider>
  );
};
