import type { Tasks } from 'freedom-email-tasks-web-worker';
import type { EmptyObject, SingleOrArray } from 'react-bindings';
import { useConstBinding } from 'react-bindings';
import type { UseWaitableArgs, WrappedResult } from 'react-waitables';
import { useWaitableFunction } from 'react-waitables';

import { useTasks } from '../contexts/tasks.tsx';

export const useTaskWaitable = <SuccessT, ErrorCodeT extends string = never, ExtraFieldsT extends object = EmptyObject>(
  call: (tasks: Tasks) => Promise<WrappedResult<SuccessT, { errorCode: ErrorCodeT | 'generic' }>>,
  options: UseWaitableArgs<SuccessT, { errorCode: ErrorCodeT | 'generic' }, ExtraFieldsT>
) => {
  const tasks = useTasks();
  const areTasksReady = useConstBinding(tasks !== undefined, { id: 'areTasksReady' });

  return useWaitableFunction<SuccessT, { errorCode: ErrorCodeT | 'generic' }, ExtraFieldsT>(async () => await call(tasks!), {
    ...options,

    deps: [tasks, ...(options.deps ?? [])],
    lockedUntil: [...(normalizeAsOptionalArray(options.lockedUntil) ?? []), areTasksReady]
  });
};

// Helpers

/** Normalizes a SingleOrArray value as an array or undefined */
const normalizeAsOptionalArray = <T>(value?: SingleOrArray<T>) =>
  value === undefined ? undefined : Array.isArray(value) ? value : [value];
