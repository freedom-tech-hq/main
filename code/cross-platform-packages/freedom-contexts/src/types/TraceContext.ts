import type { Trace } from './Trace.ts';

export interface TraceContext<T> {
  makeDefaultValue: () => T;
  provider: <ReturnT>(trace: Trace, value: T, callback: (trace: Trace) => ReturnT) => ReturnT;
}
