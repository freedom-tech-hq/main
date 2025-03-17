import { merge } from 'lodash-es';

import type { InternalTrace } from '../internal/types/InternalTrace.ts';
import type { Trace } from '../types/Trace.ts';

/** Attaches an object to the trace.  When `getTraceStackWithAttachments` is used (which is used by `traceToString`), these objects are
 * JSON stringified, where stringification errors are ignored. */
export const attachToTrace = <T extends object>(trace: Trace, values: T) => {
  const internalTrace = trace as InternalTrace;

  if (internalTrace.attached === undefined) {
    internalTrace.attached = {};
  }
  merge(internalTrace.attached, values);
};
