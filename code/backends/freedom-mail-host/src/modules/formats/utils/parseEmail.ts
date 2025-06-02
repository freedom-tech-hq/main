import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { type IsoDateTime } from 'freedom-basic-data';
import type { types } from 'freedom-email-api';
import { type AddressObject, simpleParser } from 'mailparser';

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

  // TODO: Replace snippet extraction
  const snippet = parsed.text !== undefined ? parsed.text.substring(0, 100).replace(/\s+/g, ' ').trim() : '';

  // Map to our type
  const result: ParsedMail = {
    // Open fields - none so far

    // Fields from listFields
    subject: parsed.subject ?? '',
    from: parsed.from !== undefined ? convertAddressObject(parsed.from) : [],
    priority: parsed.priority,
    snippet,

    // Fields from decryptedViewMessagePartSchema
    to: parsed.to !== undefined ? convertAddressObject(parsed.to) : [],
    cc: parsed.cc !== undefined ? convertAddressObject(parsed.cc) : [],
    bcc: parsed.bcc !== undefined ? convertAddressObject(parsed.bcc) : [],
    replyTo: parsed.replyTo !== undefined ? convertAddressObject(parsed.replyTo) : undefined,
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
