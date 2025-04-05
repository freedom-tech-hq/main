import type { Trace } from 'freedom-contexts';
import { createTraceContext, useTraceContext } from 'freedom-contexts';

const ProbeSettingsContext = createTraceContext<{ enabled: boolean; args: boolean; results: boolean }>(() => ({
  enabled: false,
  args: false,
  results: false
}));

export const useProbeSettings = (trace: Trace) => useTraceContext(trace, ProbeSettingsContext);

export const probeSettingsProvider = <ReturnT>(
  trace: Trace,
  { enabled, args = false, results = false }: { enabled: boolean; args?: boolean; results?: boolean },
  callback: (trace: Trace) => ReturnT
) => ProbeSettingsContext.provider(trace, { enabled, args, results }, callback);
