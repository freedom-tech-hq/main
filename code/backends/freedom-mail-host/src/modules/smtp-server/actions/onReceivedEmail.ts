import { makeSuccess, type PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import { log } from 'freedom-contexts';
import type { SMTPServerEnvelope } from 'smtp-server';

import { parseEmail } from '../../formats/utils/parseEmail.ts';
import { routeMail } from '../../storage/utils/routeMail.ts';
import type { SmtpServerParams } from '../internal/utils/defineSmtpServer.ts';

/**
 * Handler for received emails (no authentication)
 *
 * @param trace - Trace for async operations
 * @param emailData - The email data to process as a string
 * @param envelope - SMTP server envelope (i.e. metadata from connection)
 * @returns PR resolving when the email is processed
 */
export const onReceivedEmail: SmtpServerParams['onReceivedEmail'] = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, emailData: string, envelope: SMTPServerEnvelope): PR<undefined> => {
    // Parse the email
    const parsedEmailResult = await parseEmail(trace, emailData);
    if (!parsedEmailResult.ok) {
      return parsedEmailResult;
    }
    const parsedMail = parsedEmailResult.value;

    // Get the recipients. Note: the contents of envelope.rcptTo are already validated by onValidateReceiver
    const recipients = new Set<string>(envelope.rcptTo.map((v) => v.address));

    // Route and deliver
    await routeMail(trace, {
      recipients,
      mail: parsedMail,
      mode: {
        type: 'inbound',
        rawMail: emailData
      }
    });

    log().info?.(trace, `Delivery is successful for ${envelope.rcptTo.map((v) => v.address).join(', ')}`);

    return makeSuccess(undefined);
  }
);
