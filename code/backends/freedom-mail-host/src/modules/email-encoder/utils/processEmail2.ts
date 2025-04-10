import { makeTrace } from 'freedom-contexts';
import { addIncomingEmail } from 'freedom-fake-email-service';

import { parseEmail } from '../../formats/utils/parseEmail.ts';

export async function processEmail2(
  // TODO: recipients: string[],
  pipedEmail: string
): Promise<void> {
  // Parse the email
  const parsedEmail = await parseEmail(pipedEmail);

  // Mock
  const recipients: string[] = [];
  for (const toItem of (parsedEmail.to ? (Array.isArray(parsedEmail.to) ? parsedEmail.to : [parsedEmail.to]) : [])) {
    for (const emailAddress of toItem.value ?? []) {
      if (emailAddress.address) {
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
      to: Array.isArray(parsedEmail.to) ? parsedEmail.to.map(addr => addr.text).join(', ') : parsedEmail.to?.text ?? '',
      subject: parsedEmail.subject ?? '',
      body: parsedEmail.text ?? '',
      timeMSec: Date.now()
    });
  }
}
