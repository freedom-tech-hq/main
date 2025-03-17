import type { InternalTrace } from '../internal/types/InternalTrace.ts';
import type { Trace } from '../types/Trace.ts';

export const idStackIncludes = (trace: Trace, searchElement: string): boolean => {
  const internalTrace = trace as InternalTrace;

  return (
    internalTrace.idStack.includes(searchElement) ||
    (internalTrace.parent !== undefined && idStackIncludes(internalTrace.parent, searchElement))
  );
};
