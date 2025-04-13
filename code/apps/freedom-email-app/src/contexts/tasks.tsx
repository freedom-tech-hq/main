import { makeSuccess } from 'freedom-async';
import { devGetAllEnvOverrides } from 'freedom-contexts';
import type { Tasks } from 'freedom-email-tasks-web-worker';
import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import { useWaitableFunction, WaitablesConsumer } from 'react-waitables';

import { getTasks } from '../modules/task-support/utils/getTasks.ts';

const TasksContext = createContext<Tasks | undefined>(undefined);

export const TasksProvider = ({ children }: { children: ReactNode }) => {
  const tasks = useWaitableFunction(
    async () => {
      const tasks = await getTasks();
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
