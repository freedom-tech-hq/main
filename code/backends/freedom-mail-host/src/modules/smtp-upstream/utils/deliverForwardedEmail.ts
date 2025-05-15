import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type Mail from 'nodemailer/lib/mailer';

import { type ForwardingHeadersParams, makeForwardingHeaders } from '../../forwarding/utils/makeForwardingHeaders.ts';
import { transporter } from '../internal/utils/transporter.ts';

/**
 * Adds forwarding headers and delivers an email to an external server.
 * Returns successfully if the email is accepted by the upstream server. In our setup this means that our delivery
 * server has validated and queued it internally.
 *
 * @param _trace - Trace context for async operation tracking
 * @param rawMail - Raw email with headers as received by SMTP server
 * @param envelope - SMTP envelope containing the sender and recipient information
 * @param forwardingParams - makeForwardingHeaders() args
 * @returns Promise resolving to undefined on successful acceptance by the server
 */
export const deliverForwardedEmail = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    _trace,
    {
      rawMail,
      envelope,
      forwardingParams
    }: {
      rawMail: string;
      envelope: Mail.Envelope;
      forwardingParams: ForwardingHeadersParams;
    }
  ): PR<undefined> => {
    // Add headers
    const completeRawMail = makeForwardingHeaders(forwardingParams) + '\r\n' + rawMail;

    // Send
    await transporter.sendMail({
      raw: completeRawMail,
      envelope
    });
    return makeSuccess(undefined);
  }
);
