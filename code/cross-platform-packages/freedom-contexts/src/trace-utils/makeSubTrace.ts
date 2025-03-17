import type { InternalTrace } from '../internal/types/InternalTrace.ts';
import { simplifyIds } from '../internal/utils/simplifyIds.ts';
import type { Trace } from '../types/Trace.ts';

/** Makes a trace that is a child of the specified parent trace */
export const makeSubTrace = (trace: Trace, idStack: string[]): Trace => {
  DEV: idStack = simplifyIds(idStack);

  const internalTrace = trace as InternalTrace;

  const subTrace: InternalTrace = {
    isTrace: true,
    traceId: internalTrace.traceId,
    parent: trace,
    space: internalTrace.space,
    idStack,
    attached: undefined
  };
  return subTrace;
};
