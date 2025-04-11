import type { Trace } from 'freedom-contexts';
import { createTraceContext, useTraceContext } from 'freedom-contexts';
import type { EmailCredential } from 'freedom-email-user';

const ActiveCredentialContext = createTraceContext<{ credential?: EmailCredential }>(() => ({}));

export const useActiveCredential = (trace: Trace) => useTraceContext(trace, ActiveCredentialContext);

export const activeCredentialProvider = <ReturnT>(trace: Trace, callback: (trace: Trace) => ReturnT) =>
  ActiveCredentialContext.provider(trace, {}, callback);
