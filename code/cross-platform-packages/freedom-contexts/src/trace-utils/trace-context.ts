import type { InternalTrace } from '../internal/types/InternalTrace.ts';
import type { InternalTraceContext } from '../internal/types/InternalTraceContext.ts';
import type { Trace } from '../types/Trace.ts';
import type { TraceContext } from '../types/TraceContext.ts';
import { makeUuid } from '../utils/makeUuid.ts';

const globalContexts: Record<string, TraceContext<any>> = {};

/** Creates a trace context with a default value maker */
export const createTraceContext = <T>(makeDefaultValue: () => T): TraceContext<T> => {
  const id = makeUuid();
  const newContext: InternalTraceContext<T> = {
    id,
    makeDefaultValue,
    provider: <ReturnT>(trace: Trace, value: T, callback: (trace: Trace) => ReturnT): ReturnT => {
      const internalTrace = trace as InternalTrace;
      const subTrace = { ...internalTrace, space: { ...internalTrace.space, [id]: value } };
      return callback(subTrace);
    }
  };
  globalContexts[id] = newContext;

  return newContext;
};

/** Gets the value for the specified context in the specified trace */
export const useTraceContext = <ReturnT>(trace: Trace, context: TraceContext<ReturnT>): ReturnT => {
  const contextId = (context as InternalTraceContext<ReturnT>).id;
  const space = (trace as InternalTrace).space;
  /* node:coverage disable */
  if (!(contextId in space)) {
    const globalContext = globalContexts[contextId];
    if (globalContext !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      space[contextId] = globalContext.makeDefaultValue();
    } else {
      throw new Error(`No context found with id: ${contextId}`);
    }
  }
  /* node:coverage enable */

  return space[contextId] as ReturnT;
};
