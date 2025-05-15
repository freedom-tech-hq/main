import type { PR } from 'freedom-async';
import { debugTopic, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { OutboundEmailHandlerArgs } from 'freedom-email-server';
import { getOutboundMailById, moveOutboundMailToStorage } from 'freedom-email-sync';

import { routeMail } from './routeMail.ts';

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
    const { syncableStore, emailIds } = args;

    // Process each email ID
    for (const mailId of emailIds) {
      DEV: debugTopic('SMTP', (log) => log(trace, `Sending outbound email ${mailId}`));

      // Get the email content
      const outboundMail = await getOutboundMailById(trace, syncableStore, mailId);
      if (!outboundMail.ok) {
        return generalizeFailureResult(trace, outboundMail, 'not-found');
      }
      const mail = outboundMail.value;

      // TODO: Validate the email, ensure our users do not forge their 'From' and other

      // Route the email to be delivered
      const recipients = new Set<string>([
        // TODO: Revise the format. 'TO' is not an array of strings in the mail itself,
        //  but it should be an array of plain email addresses in the envelope
        ...(mail.to ?? []),
        ...(mail.cc ?? []),
        ...(mail.bcc ?? [])
      ]);

      const routeResult = await routeMail(trace, {
        recipients,
        mail,
        mode: { type: 'outbound' }
      });
      if (!routeResult.ok) {
        return routeResult;
      }

      DEV: debugTopic('SMTP', (log) => log(trace, `Before moveOutboundMailToStorage`));

      // Move to permanent storage after successful sending
      const moved = await moveOutboundMailToStorage(trace, syncableStore, mailId);
      if (!moved.ok) {
        return generalizeFailureResult(trace, moved, 'not-found');
      }

      DEV: debugTopic('SMTP', (log) => log(trace, `Sent outbound email ${mailId}`));
    }

    return makeSuccess(undefined);
  }
);
