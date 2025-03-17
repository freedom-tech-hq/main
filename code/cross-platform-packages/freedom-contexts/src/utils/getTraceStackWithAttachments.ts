import type { InternalTrace } from '../internal/types/InternalTrace.ts';
import type { Trace } from '../types/Trace.ts';

/** Same as `getTraceStack` except this include any trace attachment as stringified JSON objects  */
export const getTraceStackWithAttachments = (trace: Trace, out: string[] = []) => {
  const internalTrace = trace as InternalTrace;

  if (internalTrace.parent !== undefined) {
    getTraceStackWithAttachments(internalTrace.parent, out);
  }

  out.push(...internalTrace.idStack);

  if (trace.attached !== undefined) {
    try {
      out.push(JSON.stringify(trace.attached));
    } /* node:coverage disable */ catch (_e) {
      // Ignoring failures
    } /* node:coverage enable */
  }

  return out;
};
