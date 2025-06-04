import { IF } from 'freedom-logical-web-components';
import { useEffect, useRef } from 'react';
import { useBinding, useCallbackRef, useDerivedBinding } from 'react-bindings';

import { useActiveAccountInfo } from '../../contexts/active-account-info.tsx';
import { useTasks } from '../../contexts/tasks.tsx';
import { AuthScreen } from '../../flows/auth/components/screens/AuthScreen.tsx';
import { MailScreen } from '../../flows/mail/screens/MailScreen.tsx';
import { getTaskWorkerConfig } from '../../task-worker-configs/configs.ts';

export interface DemoRouterProps {
  relativePath: string[];
}

export let DemoRouter = (_props: DemoRouterProps) => <></>;
DEV: DemoRouter = ({ relativePath }: DemoRouterProps) => {
  const activeAccountInfo = useActiveAccountInfo();
  const tasks = useTasks();

  const isBusyCount = useBinding(() => 0, { id: 'isBusyCount', detectChanges: true });
  const isReady = useDerivedBinding(isBusyCount, (count) => count === 0, { id: 'isReady', limitType: 'none' });

  const wantsDemoMode = useRef(false);
  const updateDemoMode = useCallbackRef(async () => {
    await tasks?.setDemoMode(wantsDemoMode.current);
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

  return (
    <>
      {IF(isReady, () => {
        if (relativePath[0] === 'auth-screen') {
          return <AuthScreen />;
        } else if (relativePath[0] === 'mail-screen') {
          activeAccountInfo.set({ email: `demo@${getTaskWorkerConfig().defaultEmailDomain}` });
          return <MailScreen />;
        }

        return <></>;
      })}
    </>
  );
};
