import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { type StoredMail } from 'freedom-email-sync';
import { type AddressObject, type EmailAddress, simpleParser } from 'mailparser';

/**
 * Parse an email string into StoredMail
 *
 * @param _trace - Trace for async operations
 * @param emailData - Raw email data as a string
 * @returns PR resolving to the parsed email
 */
export const parseEmail = makeAsyncResultFunc([import.meta.filename], async (_trace, emailData: string): PR<StoredMail> => {
  const parsed = await simpleParser(emailData);

  // Convert to StoredMail
  const storedMail: StoredMail = {
    from: parsed.from?.text ?? '',
    to: parsed.to !== undefined ? convertAddressObject(parsed.to) : [],
    subject: parsed.subject ?? '',
    body: parsed.text ?? '',
    timeMSec: Date.now() // Not parsed.date
  };

  if (parsed.cc !== undefined) {
    storedMail.cc = convertAddressObject(parsed.cc);
  }

  if (parsed.bcc !== undefined) {
    storedMail.bcc = convertAddressObject(parsed.bcc);
  }

  return makeSuccess(storedMail);
});

function convertAddressObject(to: AddressObject | AddressObject[]): string[] {
  const result: string[] = [];
  for (const object of Array.isArray(to) ? to : [to]) {
    result.push(...convertAddresses(object.value));
  }
  return result;
}

function convertAddresses(list: EmailAddress[]): string[] {
  const result: string[] = [];
  for (const addr of list) {
    if (addr.address !== undefined) {
      result.push(addr.address); // TODO: Add name
    }

    if (addr.group !== undefined) {
      result.push(...convertAddresses(addr.group));
    }
  }
  return result;
}
