import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { getOutboundMailById, moveOutboundMailToStorage } from 'freedom-email-sync';
import type { OutboundEmailHandlerArgs } from 'freedom-fake-email-service';

import { deliverOutboundEmail } from '../../smtp-upstream/exports.ts';

/**
 * Pub/sub handler for outbound emails
 *
 * @param trace - Trace for async operations
 * @param args - Arguments for outbound email handling
 * @returns PR resolving when all emails are processed
 */
export const processOutboundEmail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, args: OutboundEmailHandlerArgs): PR<undefined> => {
    const { access, emailIds } = args;

    // Process each email ID
    for (const mailId of emailIds) {
      console.log('Sending outbound email', mailId);

      // Get the email content
      const outboundMail = await getOutboundMailById(trace, access, mailId);
      if (!outboundMail.ok) {
        return generalizeFailureResult(trace, outboundMail, 'not-found');
      }

      console.log('Before deliverOutboundEmail');

      // Send via SMTP upstream
      await deliverOutboundEmail(trace, outboundMail.value);

      console.log('Before moveOutboundMailToStorage');

      // Move to permanent storage after successful sending
      const moved = await moveOutboundMailToStorage(trace, access, mailId);
      if (!moved.ok) {
        return generalizeFailureResult(trace, moved, 'not-found');
      }

      console.log('Sent outbound email', mailId);
    }

    return makeSuccess(undefined);
  }
);
