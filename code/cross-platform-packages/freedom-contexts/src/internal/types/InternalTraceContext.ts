import type { TraceContext } from '../../types/TraceContext.ts';

export interface InternalTraceContext<T> extends TraceContext<T> {
  id: string;
}
