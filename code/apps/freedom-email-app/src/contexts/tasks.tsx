import type { TraceableError } from 'freedom-async';
import { log, makeSuccess } from 'freedom-async';
import { devGetAllEnvOverrides } from 'freedom-contexts';
import type { Tasks } from 'freedom-email-tasks-web-worker';
import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import { useWaitableFunction, WaitablesConsumer } from 'react-waitables';

import { getAppEnvironment } from '../consts/appEnvironments.ts';
import { getTasks } from '../modules/task-support/utils/getTasks.ts';
import { taskWorkerConfigs } from '../task-worker-configs/configs.ts';

const TasksContext = createContext<Tasks | undefined>(undefined);

export const TasksProvider = ({ children }: { children: ReactNode }) => {
  const tasks = useWaitableFunction<Tasks, TraceableError>(
    async () => {
      const appEnv = getAppEnvironment();
      console.log('App environment:', appEnv);

      const tasks = await getTasks();
      const configured = await tasks.setConfig(taskWorkerConfigs[appEnv]);
      if (!configured.ok) {
        log().error?.('Failed to configure tasks worker', configured.value);
        return configured;
      }
      DEV: await tasks.devFwdEnv(devGetAllEnvOverrides());
      return makeSuccess(tasks);
    },
    { id: 'tasks' }
  );

  return (
    <WaitablesConsumer dependencies={tasks}>
      {{ always: (tasks) => <TasksContext value={tasks}>{children}</TasksContext> }}
    </WaitablesConsumer>
  );
};

export const useTasks = () => useContext(TasksContext);
