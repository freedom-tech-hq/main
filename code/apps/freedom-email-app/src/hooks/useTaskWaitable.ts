import type { PR, TraceableError } from 'freedom-async';
import type { Tasks } from 'freedom-email-tasks-web-worker';
import type { EmptyObject, SingleOrArray } from 'react-bindings';
import { useConstBinding } from 'react-bindings';
import type { UseWaitableArgs } from 'react-waitables';
import { useWaitableFunction } from 'react-waitables';

import { useTasks } from '../contexts/tasks.tsx';

export const useTaskWaitable = <SuccessT, ErrorCodeT extends string = never, ExtraFieldsT extends object = EmptyObject>(
  call: (tasks: Tasks) => PR<SuccessT, ErrorCodeT>,
  options: UseWaitableArgs<SuccessT, TraceableError<ErrorCodeT>, ExtraFieldsT>
) => {
  const tasks = useTasks();
  const areTasksReady = useConstBinding(tasks !== undefined, { id: 'areTasksReady' });

  return useWaitableFunction<SuccessT, TraceableError<ErrorCodeT>, ExtraFieldsT>(async () => await call(tasks!), {
    ...options,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    deps: [tasks, ...(options.deps ?? [])],
    lockedUntil: [...(normalizeAsOptionalArray(options.lockedUntil) ?? []), areTasksReady]
  });
};

// Helpers

/** Normalizes a SingleOrArray value as an array or undefined */
const normalizeAsOptionalArray = <T>(value?: SingleOrArray<T>) =>
  value === undefined ? undefined : Array.isArray(value) ? value : [value];
