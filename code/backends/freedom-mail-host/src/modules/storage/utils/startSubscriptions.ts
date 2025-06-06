import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';

import { processOutboundEmail } from './processOutboundEmail.ts';
import { subscribeOnOutboundEmails } from './subscribeOnOutboundEmails.ts';

/**
 * Start subscriptions for processing outbound emails
 *
 * @param trace - Trace for async operations
 * @returns PR resolving when subscriptions are started
 */
export const startSubscriptions = makeAsyncResultFunc([import.meta.filename], async (trace): PR<undefined> => {
  // Subscribe to outbound emails
  const result = await subscribeOnOutboundEmails(trace, processOutboundEmail);
  if (!result.ok) {
    return result;
  }

  return makeSuccess(undefined);
});
