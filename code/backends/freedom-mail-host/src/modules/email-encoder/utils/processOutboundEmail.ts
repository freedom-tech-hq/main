import { makeTrace } from 'freedom-contexts';
import { getOutboundMailById, moveOutboundMailToStorage } from 'freedom-email-sync';
import type { OutboundEmailHandlerArgs } from 'freedom-fake-email-service';

import { deliverOutboundEmail } from '../../smtp-upstream/exports.ts';

/**
 * Pub/sub handler for outbound emails
 */
export async function processOutboundEmail(args: OutboundEmailHandlerArgs): Promise<void> {
  const trace = makeTrace('freedom-mail-host');
  const { access, emailIds } = args;

  // Process each email ID
  for (const mailId of emailIds) {
    console.log('Sending outbound email', mailId);

    // Get the email content
    const outboundMail = await getOutboundMailById(trace, access, mailId);
    if (!outboundMail.ok) {
      // Let errors propagate up
      throw new Error(`Failed to get outbound mail ${mailId}: ${outboundMail.value}`);
    }

    console.log('Before deliverOutboundEmail');

    // Send via SMTP upstream
    await deliverOutboundEmail(outboundMail.value);

    console.log('Before moveOutboundMailToStorage');

    // Move to permanent storage after successful sending
    const moved = await moveOutboundMailToStorage(trace, access, mailId);
    if (!moved.ok) {
      throw new Error(`Failed to move outbound mail ${mailId} to storage: ${moved.value}`);
    }

    console.log('Sent outbound email', mailId);
  }
}
