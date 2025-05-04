import type { PR } from 'freedom-async';
import { debugTopic, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { OutboundEmailHandlerArgs } from 'freedom-email-server';
import { addIncomingEmail } from 'freedom-email-server';
import { getOutboundMailById, moveOutboundMailToStorage } from 'freedom-email-sync';

import * as config from '../../../config.ts';
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
      DEV: debugTopic('SMTP', (log) => log(`Sending outbound email ${mailId}`));

      // Get the email content
      const outboundMail = await getOutboundMailById(trace, access, mailId);
      if (!outboundMail.ok) {
        return generalizeFailureResult(trace, outboundMail, 'not-found');
      }
      const mail = outboundMail.value;

      // TODO: Validate the email, ensure our users do not forge their 'From' and other

      // Separate internal and external recipients
      const allRecipients = new Set<string>([
        // TODO: Revise the format. 'TO' is not an array of strings in the mail itself,
        //  but it should be an array of plain email addresses in the envelope
        ...(mail.to ?? []),
        ...(mail.cc ?? []),
        ...(mail.bcc ?? [])
      ]);

      const internalRecipients: string[] = [];
      const externalRecipients: string[] = [];
      for (const recipient of allRecipients) {
        const [, domain] = recipient.split('@');
        if (domain && config.SMTP_OUR_DOMAINS.includes(domain)) {
          internalRecipients.push(recipient);
        } else {
          externalRecipients.push(recipient);
        }
      }

      // Internal recipients
      for (const recipient of internalRecipients) {
        DEV: debugTopic('SMTP', (log) => log(`Processing internal recipient: ${recipient}`));

        await addIncomingEmail(trace, recipient, mail);
      }

      // External recipients
      if (externalRecipients.length > 0) {
        DEV: debugTopic('SMTP', (log) => log(`Processing ${externalRecipients.length} external recipients`));

        // Post to SMTP upstream
        await deliverOutboundEmail(trace, mail, {
          from: mail.from,
          to: externalRecipients.join(',')
        });
      }

      DEV: debugTopic('SMTP', (log) => log(`Before moveOutboundMailToStorage`));

      // Move to permanent storage after successful sending
      const moved = await moveOutboundMailToStorage(trace, access, mailId);
      if (!moved.ok) {
        return generalizeFailureResult(trace, moved, 'not-found');
      }

      DEV: debugTopic('SMTP', (log) => log(`Sent outbound email ${mailId}`));
    }

    return makeSuccess(undefined);
  }
);
