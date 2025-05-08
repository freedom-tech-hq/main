import type { Trace } from 'freedom-contexts';
import { createTraceContext, useTraceContext } from 'freedom-contexts';

const AcquiredLocksContext = createTraceContext<{ acquiredLockUids: Readonly<Set<string>> }>(() => ({ acquiredLockUids: new Set() }));

export const useAcquiredLocks = (trace: Trace) => useTraceContext(trace, AcquiredLocksContext);

export const acquiredLocksProvider = <ReturnT>(
  trace: Trace,
  { acquiredLockUids }: { acquiredLockUids: string[] },
  callback: (trace: Trace) => ReturnT
) => {
  const ancestorValue = useAcquiredLocks(trace);
  const newValue = new Set([...ancestorValue.acquiredLockUids, ...acquiredLockUids]);
  return AcquiredLocksContext.provider(trace, { acquiredLockUids: newValue }, callback);
};
