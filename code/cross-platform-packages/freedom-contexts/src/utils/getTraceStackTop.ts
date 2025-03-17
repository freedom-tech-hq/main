import type { InternalTrace } from '../internal/types/InternalTrace.ts';
import type { Trace } from '../types/Trace.ts';

export const getTraceStackTop = (trace: Trace) => {
  const internalTrace = trace as InternalTrace;
  return internalTrace.idStack.join('>');
};
