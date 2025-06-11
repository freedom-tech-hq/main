import { IF, NOT } from 'freedom-logical-web-components';
import type { ReactNode } from 'react';
import React, { useEffect, useRef } from 'react';
import { useCallbackRef } from 'react-bindings';

import { useTasks } from '../../contexts/tasks.tsx';
import { useIsBusy } from '../../hooks/useIsBusy.tsx';
import { appRoot } from './appRoot.tsx';

export const EnableDemoMode = ({ children }: { children: ReactNode }) => {
  const isBusy = useIsBusy();
  const tasks = useTasks();

  // TODO: set to 1 on first render

  const wantsDemoMode = useRef(false);
  const lastUnmarkBusy = useRef<() => void>(() => {});
  const updateDemoMode = useCallbackRef(async () => {
    await tasks?.setDemoMode(wantsDemoMode.current);
    appRoot.setDemoMode(wantsDemoMode.current);
    lastUnmarkBusy.current();
  });

  useEffect(() => {
    wantsDemoMode.current = true;
    lastUnmarkBusy.current = isBusy.markBusy();
    setTimeout(updateDemoMode, 0);

    return () => {
      wantsDemoMode.current = false;
      lastUnmarkBusy.current();
      setTimeout(updateDemoMode, 0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  return IF(NOT(isBusy), () => <>{children}</>);
};
