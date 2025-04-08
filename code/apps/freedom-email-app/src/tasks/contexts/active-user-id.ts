import type { Trace } from 'freedom-contexts';
import { createTraceContext, useTraceContext } from 'freedom-contexts';
import type { EmailUserId } from 'freedom-email-sync';

const ActiveUserIdContext = createTraceContext<{ userId?: EmailUserId }>(() => ({}));

export const useActiveUserId = (trace: Trace) => useTraceContext(trace, ActiveUserIdContext);

export const activeUserIdProvider = <ReturnT>(trace: Trace, callback: (trace: Trace) => ReturnT) =>
  ActiveUserIdContext.provider(trace, {}, callback);
