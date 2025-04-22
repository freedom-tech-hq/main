import type { Trace } from 'freedom-contexts';
import { createTraceContext, useTraceContext } from 'freedom-contexts';

const IsSyncableValidationEnabledContext = createTraceContext<{ enabled: boolean }>(() => ({ enabled: true }));

export const useIsSyncableValidationEnabled = (trace: Trace) => useTraceContext(trace, IsSyncableValidationEnabledContext);

export const isSyncableValidationEnabledProvider = <ReturnT>(trace: Trace, enabled: boolean, callback: (trace: Trace) => ReturnT) =>
  IsSyncableValidationEnabledContext.provider(trace, { enabled }, callback);
