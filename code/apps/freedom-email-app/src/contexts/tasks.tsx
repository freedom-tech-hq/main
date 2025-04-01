import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import { useWaitableFunction, WaitablesConsumer } from 'react-waitables';

import { getTasks } from '../modules/task-support/utils/getTasks.ts';
import type { Tasks } from '../tasks.ts';

const TasksContext = createContext<Tasks | undefined>(undefined);

export const TasksProvider = ({ children }: { children: ReactNode }) => {
  const tasks = useWaitableFunction(async () => ({ ok: true, value: await getTasks() }), { id: 'tasks' });

  return (
    <WaitablesConsumer dependencies={tasks}>
      {{ always: (tasks) => <TasksContext value={tasks}>{children}</TasksContext> }}
    </WaitablesConsumer>
  );
};

export const useTasks = () => useContext(TasksContext);
