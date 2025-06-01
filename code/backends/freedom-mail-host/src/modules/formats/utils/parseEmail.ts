import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { type DecryptedMessage, type MailAddressList } from 'freedom-email-sync';
import { type AddressObject, simpleParser } from 'mailparser';

import { convertMailAddress } from '../internal/utils/convertMailAddress.ts';

/**
 * Parse an email string into StoredMail
 *
 * @param _trace - Trace for async operations
 * @param emailData - Raw email data as a string
 * @returns PR resolving to the parsed email
 */
export const parseEmail = makeAsyncResultFunc([import.meta.filename], async (_trace, emailData: string): PR<DecryptedMessage> => {
  const parsed = await simpleParser(emailData);

  // Convert to StoredMail
  const result: DecryptedMessage = {
    from: parsed.from?.text ?? '',
    to: parsed.to !== undefined ? convertAddressObject(parsed.to) : [],
    subject: parsed.subject ?? '',
    body: parsed.text ?? '',
    timeMSec: Date.now() // Not parsed.date
  };

  if (parsed.cc !== undefined) {
    result.cc = convertAddressObject(parsed.cc);
  }

  if (parsed.bcc !== undefined) {
    result.bcc = convertAddressObject(parsed.bcc);
  }

  return makeSuccess(result);
});

function convertAddressObject(to: AddressObject | AddressObject[]): MailAddressList {
  const result: MailAddressList = [];
  for (const object of Array.isArray(to) ? to : [to]) {
    result.push(...convertMailAddress(object.value));
  }
  return result;
}
