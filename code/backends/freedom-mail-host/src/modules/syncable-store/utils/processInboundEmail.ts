import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { makeTrace } from 'freedom-contexts';
import { addIncomingEmail } from 'freedom-fake-email-service';

import { parseEmail } from '../../formats/utils/parseEmail.ts';

/**
 * Process an inbound email by parsing it and delivering to recipients
 *
 * @param trace - Trace for async operations
 * @param pipedEmail - Raw email data as a string
 * @returns PR resolving when the email is processed
 */
export const processInboundEmail = makeAsyncResultFunc([import.meta.filename], async (trace, pipedEmail: string): PR<undefined> => {
  // Parse the email
  const parsedEmailResult = await parseEmail(trace, pipedEmail);
  if (!parsedEmailResult.ok) {
    return parsedEmailResult;
  }
  const parsedEmail = parsedEmailResult.value;

  // Mock
  const recipients: string[] = [];
  for (const toItem of parsedEmail.to ? (Array.isArray(parsedEmail.to) ? parsedEmail.to : [parsedEmail.to]) : []) {
    for (const emailAddress of toItem.value ?? []) {
      if (emailAddress.address !== undefined && emailAddress.address !== '') {
        recipients.push(emailAddress.address);
      }
    }
  }

  for (const recipient of recipients) {
    // Handle
    const trace = makeTrace('freedom-mail-host');
    await addIncomingEmail(trace, {
      rcpt: recipient,
      from: parsedEmail.from?.text ?? '',
      to: Array.isArray(parsedEmail.to) ? parsedEmail.to.map((addr) => addr.text).join(', ') : (parsedEmail.to?.text ?? ''),
      subject: parsedEmail.subject ?? '',
      body: parsedEmail.text ?? '',
      timeMSec: Date.now()
    });
  }

  return makeSuccess(undefined);
});
