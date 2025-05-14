import type { Trace } from 'freedom-contexts';
import { createTraceContext, useTraceContext } from 'freedom-contexts';

import { FREEDOM_MAX_CONCURRENCY_DEFAULT } from '../consts/concurrency.ts';

const ConcurrencyContext = createTraceContext<{ defaultMaxConcurrency?: number }>(() => ({}));

export const useDefaultMaxConcurrency = (trace: Trace) =>
  useTraceContext(trace, ConcurrencyContext).defaultMaxConcurrency ?? FREEDOM_MAX_CONCURRENCY_DEFAULT;

export const defaultMaxConcurrencyProvider = <ReturnT>(
  trace: Trace,
  { defaultMaxConcurrency }: { defaultMaxConcurrency: number },
  callback: (trace: Trace) => ReturnT
) => ConcurrencyContext.provider(trace, { defaultMaxConcurrency }, callback);
