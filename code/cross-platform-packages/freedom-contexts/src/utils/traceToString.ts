import type { Trace } from '../types/Trace.ts';
import { getTraceStackWithAttachments } from './getTraceStackWithAttachments.ts';

export const traceToString = (trace: Trace) => `traceId=${trace.traceId} stack=${getTraceStackWithAttachments(trace).join('>')}`;
