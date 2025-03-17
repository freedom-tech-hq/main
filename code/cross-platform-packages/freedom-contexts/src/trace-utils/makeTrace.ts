import type { InternalTrace } from '../internal/types/InternalTrace.ts';
import { simplifyIds } from '../internal/utils/simplifyIds.ts';
import type { Trace } from '../types/Trace.ts';
import { makeUuid } from '../utils/makeUuid.ts';

/** Makes a new trace with a specified initial ID stack */
export const makeTrace = (...idStack: string[]): Trace => {
  DEV: idStack = simplifyIds(idStack);

  const trace: InternalTrace = {
    isTrace: true,
    traceId: makeUuid(),
    idStack,
    space: {}
  };
  return trace;
};
