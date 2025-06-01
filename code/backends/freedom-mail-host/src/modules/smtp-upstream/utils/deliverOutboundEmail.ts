import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { types } from 'freedom-email-api';
import type Mail from 'nodemailer/lib/mailer';

import type { ParsedMail } from '../../formats/types/ParsedMail.ts';
import { transporter } from '../internal/utils/transporter.ts';

/**
 * Deliver an email to an external server.
 * Returns successfully if the email is accepted by the upstream server. In our setup this means that our delivery
 * server has validated and queued it internally.
 *
 * @param _trace - Trace for async operations
 * @param mail - The stored mail object containing email data
 * @param envelope - Optional envelope parameter specifying the SMTP envelope properties
 * @returns PR resolving when the email is accepted
 */
export const deliverOutboundEmail = makeAsyncResultFunc(
  [import.meta.filename],
  async (_trace, mail: ParsedMail, envelope?: Mail.Envelope): PR<undefined> => {
    await transporter.sendMail({
      from: mail.from,
      to: mail.to,
      cc: mail.cc,
      bcc: mail.bcc,
      subject: mail.subject,
      text: mail.body,
      envelope
    });
    return makeSuccess(undefined);
  }
);
