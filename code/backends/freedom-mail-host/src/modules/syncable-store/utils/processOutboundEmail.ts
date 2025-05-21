import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { OutboundEmailHandlerArgs } from 'freedom-email-server';
import { getOutboundMailById, moveOutboundMailToStorage } from 'freedom-email-sync';

import { routeMail } from './routeMail.ts';

/**
 * Pub/sub handler for outbound emails
 */
export const processOutboundEmail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { user, syncableStore, emailIds }: OutboundEmailHandlerArgs): PR<undefined> => {
    // Process each email ID
    for (const mailId of emailIds) {
      // console.log(`processOutboundEmail: Sending outbound email ${mailId}`);

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

      // Set from address
      // TODO: Validate, if the user attempted to add non-sense. Provide feedback to the user.
      // 'sender' is a current implementation on the frontend. It should be fixed in the future.
      if (mail.from === 'sender') {
        mail.from = user.email;
      }

      // console.log(`processOutboundEmail: Routing`, mail, `to`, recipients);
      const routeResult = await routeMail(trace, {
        recipients,
        mail,
        mode: { type: 'outbound' }
      });
      if (!routeResult.ok) {
        return routeResult;
      }

      // console.log(`processOutboundEmail: Before moveOutboundMailToStorage`);

      // Move to permanent storage after successful sending
      const moved = await moveOutboundMailToStorage(trace, syncableStore, mailId);
      if (!moved.ok) {
        return generalizeFailureResult(trace, moved, 'not-found');
      }

      // console.log(`processOutboundEmail: Sent outbound email ${mailId}`);
    }

    return makeSuccess(undefined);
  }
);
