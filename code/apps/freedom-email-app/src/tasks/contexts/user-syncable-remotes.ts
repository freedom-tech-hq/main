import type { Trace } from 'freedom-contexts';
import { createTraceContext, useTraceContext } from 'freedom-contexts';
import type { RemoteInfo } from 'freedom-sync-types';

const UserSyncableRemotesContext = createTraceContext<RemoteInfo[]>(() => []);

export const useUserSyncableRemotesContext = (trace: Trace) => useTraceContext(trace, UserSyncableRemotesContext);

export const useUserSyncableRemotes = (trace: Trace) => useTraceContext(trace, UserSyncableRemotesContext);

export const userSyncableRemotesContextProvider = <ReturnT>(trace: Trace, remotes: RemoteInfo[], callback: (trace: Trace) => ReturnT) =>
  UserSyncableRemotesContext.provider(trace, remotes, callback);
