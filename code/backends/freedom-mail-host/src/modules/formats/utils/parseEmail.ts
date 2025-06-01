import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { makeIsoDateTime } from 'freedom-basic-data';
import { type IsoDateTime } from 'freedom-basic-data';
import { makeUuid } from 'freedom-contexts';
import { types } from 'freedom-email-api';
import { type AddressObject, type EmailAddress, simpleParser } from 'mailparser';

import { convertMailAddress } from '../internal/utils/convertMailAddress.ts';
import type { ParsedMail } from '../types/ParsedMail.ts';

/**
 * Parse an email string into our ParsedMail
 *
 * @param _trace - Trace for async operations
 * @param emailData - Raw email data as a string
 * @returns PR resolving to the parsed email
 */
export const parseEmail = makeAsyncResultFunc([import.meta.filename], async (_trace, emailData: string): PR<ParsedMail> => {
  const parsed = await simpleParser(emailData);

  const transferredAt = new Date();
  // TODO: Replace snippet extraction
  const snippet = parsed.text !== undefined ? parsed.text.substring(0, 100).replace(/\s+/g, ' ').trim() : '';

  // Map to our type
  const result: ParsedMail = {
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

    // Optional fields
    messageId: parsed.messageId,
    inReplyTo: parsed.inReplyTo,
    references: parsed.references !== undefined ? (Array.isArray(parsed.references) ? parsed.references : [parsed.references]) : undefined,
    date: parsed.date !== undefined ? (parsed.date.toISOString() as IsoDateTime) : undefined,

    // Raw message
    raw: emailData
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

function convertSingleAddressObject(item: AddressObject): types.MailAddress | undefined {
  // TODO: Revise https://chatgpt.com/c/683c382a-3f98-800d-a72b-329721d33945

  // Note: `mailparser` typing is too generic here
  const expectedItem: EmailAddress | undefined = item.value[0];

  if (expectedItem?.address !== undefined) {
    return {
      name: expectedItem.name,
      address: expectedItem.address
    };
  }

  return undefined;
}
