import type { Trace } from 'freedom-contexts';
import { createTraceContext, useTraceContext } from 'freedom-contexts';

import type { EmailUserId } from '../../types/EmailUserId.ts';

const ActiveUserIdContext = createTraceContext<{ userId?: EmailUserId }>(() => ({}));

export const useActiveUserIdContext = (trace: Trace) => useTraceContext(trace, ActiveUserIdContext);

export const useActiveUserId = (trace: Trace) => useTraceContext(trace, ActiveUserIdContext);

export const activeUserIdContextProvider = <ReturnT>(trace: Trace, callback: (trace: Trace) => ReturnT) =>
  ActiveUserIdContext.provider(trace, {}, callback);
