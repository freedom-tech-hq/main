import type { InternalTrace } from '../internal/types/InternalTrace.ts';
import type { Trace } from '../types/Trace.ts';

/** Gets the current trace stack */
export const getTraceStack = (trace: Trace, out: string[] = []) => {
  const internalTrace = trace as InternalTrace;

  if (internalTrace.parent !== undefined) {
    getTraceStack(internalTrace.parent, out);
  }

  out.push(...internalTrace.idStack);

  return out;
};
