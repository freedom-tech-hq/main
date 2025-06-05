import { IF, NOT } from 'freedom-logical-web-components';
import type { ReactNode } from 'react';
import React, { useEffect, useRef } from 'react';
import { useBinding, useCallbackRef, useDerivedBinding } from 'react-bindings';

import { useTasks } from '../../contexts/tasks.tsx';
import { appRoot } from './appRoot.tsx';

export const EnableDemoMode = ({ children }: { children: ReactNode }) => {
  const tasks = useTasks();

  const isBusyCount = useBinding(() => 0, { id: 'isBusyCount', detectChanges: true });
  const isBusy = useDerivedBinding(isBusyCount, (count) => count > 0, { id: 'isBusy', limitType: 'none' });

  // TODO: set to 1 on first render

  const wantsDemoMode = useRef(false);
  const updateDemoMode = useCallbackRef(async () => {
    await tasks?.setDemoMode(wantsDemoMode.current);
    appRoot.setDemoMode(wantsDemoMode.current);
    isBusyCount.set(isBusyCount.get() - 1);
  });

  useEffect(() => {
    wantsDemoMode.current = true;
    isBusyCount.set(isBusyCount.get() + 1);
    setTimeout(updateDemoMode, 0);

    return () => {
      wantsDemoMode.current = false;
      isBusyCount.set(isBusyCount.get() + 1);
      setTimeout(updateDemoMode, 0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  return IF(NOT(isBusy), () => <>{children}</>);
};
