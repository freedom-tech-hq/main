import type { Trace } from 'freedom-contexts';
import { createTraceContext, useTraceContext } from 'freedom-contexts';
import type { AuthToken } from 'freedom-server-auth';

const AuthTokenContext = createTraceContext<AuthToken | undefined>(() => undefined);

export const useAuthTokenContext = (trace: Trace) => useTraceContext(trace, AuthTokenContext);

export const authTokenContextProvider = <ReturnT>(trace: Trace, authToken: AuthToken | undefined, callback: (trace: Trace) => ReturnT) =>
  AuthTokenContext.provider(trace, authToken, callback);
