import type { Trace } from 'freedom-contexts';
import { createTraceContext, useTraceContext } from 'freedom-contexts';

import { defaultServiceContext } from './defaultServiceContext.ts';
import type { ServiceContext } from './ServiceContext.ts';

const TraceServiceContext = createTraceContext<ServiceContext>(() => defaultServiceContext);

export const useTraceServiceContext = (trace: Trace) => useTraceContext(trace, TraceServiceContext);

export const traceServiceContextProvider = <ReturnT>(trace: Trace, value: ServiceContext, callback: (trace: Trace) => ReturnT) =>
  TraceServiceContext.provider(trace, value, callback);
