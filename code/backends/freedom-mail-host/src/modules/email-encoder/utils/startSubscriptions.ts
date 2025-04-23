import { subscribeOnOutboundEmails } from 'freedom-fake-email-service';

import { processOutboundEmail } from './processOutboundEmail.ts';

/**
 * Start subscriptions for processing outbound emails
 */
export async function startSubscriptions(): Promise<void> {
  // Subscribe to outbound emails
  await subscribeOnOutboundEmails(processOutboundEmail);
}
