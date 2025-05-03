import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { log } from 'freedom-contexts';
import { addIncomingEmail } from 'freedom-email-server';
import type { SMTPServerEnvelope } from 'smtp-server';

import { parseEmail } from '../../formats/utils/parseEmail.ts';

/**
 * Process an inbound email by parsing it and delivering to recipients
 *
 * @param trace - Trace for async operations
 * @param pipedEmail - Raw email data as a string
 * @param envelope - SMTP server envelope (i.e. metadata from connection)
 * @returns PR resolving when the email is processed
 */
export const processInboundEmail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, pipedEmail: string, envelope: SMTPServerEnvelope): PR<undefined> => {
    // Parse the email
    const parsedEmailResult = await parseEmail(trace, pipedEmail);
    if (!parsedEmailResult.ok) {
      return parsedEmailResult;
    }
    const parsedMail = parsedEmailResult.value;

    // TODO: Validate envelope and parsed email to match each other

    // Deliver to each recipient
    for (const recipient of envelope.rcptTo) {
      await addIncomingEmail(trace, recipient.address, parsedMail);
    }

    log().info?.(trace, `Delivery is successful for ${envelope.rcptTo.map((v) => v.address).join(', ')}`);

    return makeSuccess(undefined);
  }
);
