import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { makeIsoDateTime } from 'freedom-basic-data';
import { makeUuid } from 'freedom-contexts';
import { type DecryptedMessage, type MailAddress, type MailAddressList, mailIdInfo } from 'freedom-email-sync';
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

  const transferredAt = new Date();
  const snippet = parsed.text ? parsed.text.substring(0, 100).replace(/\s+/g, ' ').trim() : '';

  // Convert to DecryptedMessage with all required fields
  const result: DecryptedMessage = {
    // Open fields
    // TODO: Revise the security. Freezing extra data in IDs potentially disrupts the ability to fix privacy
    id: mailIdInfo.make(`${makeIsoDateTime(transferredAt)}-${makeUuid()}`),
    transferredAt: transferredAt.toISOString(),

    // Fields from listFields
    subject: parsed.subject,
    from: parsed.from !== undefined ? convertFromAddressObject(parsed.from) : undefined,
    priority: parsed.priority,
    snippet,

    // Fields from decryptedViewMessagePartSchema
    cc: parsed.cc ? convertAddressObject(parsed.cc) : [],
    bcc: parsed.bcc ? convertAddressObject(parsed.bcc) : [],
    replyTo: parsed.replyTo ? convertMailAddress(parsed.replyTo.value)[0] : undefined,
    isBodyHtml: !!parsed.html,
    body: parsed.html ?? parsed.text ?? '',

    // Raw message (required by DecryptedMessage)
    raw: emailData,

    // Optional fields
    messageId: parsed.messageId,
    inReplyTo: parsed.inReplyTo,
    references: parsed.references ? (Array.isArray(parsed.references) ? parsed.references : [parsed.references]) : undefined,
    date: parsed.date ? parsed.date.toISOString() : undefined
  };

  return makeSuccess(result);
});

function convertAddressObject(to: AddressObject | AddressObject[]): MailAddressList {
  const result: MailAddressList = [];
  for (const object of Array.isArray(to) ? to : [to]) {
    result.push(...convertMailAddress(object.value));
  }
  return result;
}

function convertFromAddressObject(from: AddressObject): MailAddress {
  // TODO: Revise https://chatgpt.com/c/683c382a-3f98-800d-a72b-329721d33945
  return convertMailAddress(from.value)[0];
}
