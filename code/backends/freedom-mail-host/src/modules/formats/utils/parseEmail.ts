import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { makeIsoDateTime } from 'freedom-basic-data';
import { type IsoDateTime } from 'freedom-basic-data';
import { makeUuid } from 'freedom-contexts';
import { types } from 'freedom-email-api';
import { type AddressObject, simpleParser } from 'mailparser';

import { convertMailAddress } from '../internal/utils/convertMailAddress.ts';

/**
 * Parse an email string into StoredMail
 *
 * @param _trace - Trace for async operations
 * @param emailData - Raw email data as a string
 * @returns PR resolving to the parsed email
 */
export const parseEmail = makeAsyncResultFunc([import.meta.filename], async (_trace, emailData: string): PR<types.DecryptedMessage> => {
  const parsed = await simpleParser(emailData);

  const transferredAt = new Date();
  // TODO: Replace snippet extraction
  const snippet = parsed.text !== undefined ? parsed.text.substring(0, 100).replace(/\s+/g, ' ').trim() : '';

  // Convert to DecryptedMessage with all required fields
  const result: types.DecryptedMessage = {
    // Open fields
    // TODO: Revise the security. Freezing extra data in IDs potentially disrupts the ability to fix privacy
    id: types.mailIdInfo.make(`${makeIsoDateTime(transferredAt)}-${makeUuid()}`),
    transferredAt: transferredAt.toISOString() as IsoDateTime,

    // Fields from listFields
    subject: parsed.subject ?? '',
    from: parsed.from !== undefined ? convertSingleAddressObject(parsed.from) : undefined,
    priority: parsed.priority,
    snippet,

    // Fields from decryptedViewMessagePartSchema
    to: parsed.to !== undefined ? convertAddressObject(parsed.to) : [],
    cc: parsed.cc !== undefined ? convertAddressObject(parsed.cc) : [],
    bcc: parsed.bcc !== undefined ? convertAddressObject(parsed.bcc) : [],
    replyTo: parsed.replyTo !== undefined ? convertSingleAddressObject(parsed.replyTo) : undefined,
    isBodyHtml: parsed.html !== false,
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions -- `html` is `string | false`
    body: (parsed.html || parsed.text) ?? '',

    // Raw message (required by DecryptedMessage)
    raw: emailData,

    // Optional fields
    messageId: parsed.messageId,
    inReplyTo: parsed.inReplyTo,
    references: parsed.references !== undefined ? (Array.isArray(parsed.references) ? parsed.references : [parsed.references]) : undefined,
    date: parsed.date !== undefined ? (parsed.date.toISOString() as IsoDateTime) : undefined
  };

  return makeSuccess(result);
});

function convertAddressObject(to: AddressObject | AddressObject[]): types.MailAddressList {
  const result: types.MailAddressList = [];
  for (const object of Array.isArray(to) ? to : [to]) {
    result.push(...convertMailAddress(object.value));
  }
  return result;
}

function convertSingleAddressObject(from: AddressObject): types.MailAddress | undefined {
  // TODO: Revise https://chatgpt.com/c/683c382a-3f98-800d-a72b-329721d33945
  return convertMailAddress(from.value)[0];
}
