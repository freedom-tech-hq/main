import type { Trace } from 'freedom-contexts';
import { createTraceContext, useTraceContext } from 'freedom-contexts';

import type { MockRemote } from './startMockRemote.ts';

const MockRemotesContext = createTraceContext<{ mockRemotes?: MockRemote }>(() => ({}));

export const useMockRemotesContext = (trace: Trace) => useTraceContext(trace, MockRemotesContext);

export const useMockRemotes = (trace: Trace) => useTraceContext(trace, MockRemotesContext);
