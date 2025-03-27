import type { Trace } from 'freedom-contexts';
import { createTraceContext, useTraceContext } from 'freedom-contexts';

import type { MockRemotes } from './startMockRemotes.ts';

const MockRemotesContext = createTraceContext<{ mockRemotes?: MockRemotes }>(() => ({}));

export const useMockRemotesContext = (trace: Trace) => useTraceContext(trace, MockRemotesContext);

export const useMockRemotes = (trace: Trace) => useTraceContext(trace, MockRemotesContext);
