import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { subscribeOnOutboundEmails } from 'freedom-fake-email-service';

import { processOutboundEmail } from './processOutboundEmail.ts';

/**
 * Start subscriptions for processing outbound emails
 *
 * @param trace - Trace for async operations
 * @returns PR resolving when subscriptions are started
 */
export const startSubscriptions = makeAsyncResultFunc([import.meta.filename], async (trace): PR<void> => {
  // Subscribe to outbound emails
  const result = await subscribeOnOutboundEmails(trace, processOutboundEmail);
  if (!result.ok) {
    return result;
  }

  return makeSuccess(undefined);
});
