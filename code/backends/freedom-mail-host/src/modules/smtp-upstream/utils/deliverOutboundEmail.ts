import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { types } from 'freedom-email-api';
import type Mail from 'nodemailer/lib/mailer';

import type { ParsedMail } from '../../formats/types/ParsedMail.ts';
import { transporter } from '../internal/utils/transporter.ts';

/**
 * Deliver an email to an external server.
 * Returns successfully if the email is accepted by the upstream server. In our setup this means that our delivery
 * server has validated and queued it internally.
 *
 * @param _trace - Trace for async operations
 * @param mail - The stored mail object containing email data
 * @param envelope - Optional envelope parameter specifying the SMTP envelope properties
 * @returns PR resolving when the email is accepted
 */
export const deliverOutboundEmail = makeAsyncResultFunc(
  [import.meta.filename],
  async (_trace, mail: ParsedMail, envelope: Mail.Envelope): PR<undefined> => {
    await transporter.sendMail({
      // listFields
      subject: mail.subject,
      from: getAddressFromList(mail.from),
      sender: mail.sender !== undefined ? convertAddress(mail.sender) : undefined,
      priority: mail.priority,

      // viewFields
      to: convertAddressList(mail.to),
      cc: convertAddressList(mail.cc),
      bcc: convertAddressList(mail.bcc),
      replyTo: convertAddressList(mail.replyTo),

      text: mail.isBodyHtml ? undefined : mail.body,
      html: mail.isBodyHtml ? mail.body : undefined,

      messageId: mail.messageId,
      inReplyTo: mail.inReplyTo,
      references: mail.references,

      date: mail.date,

      // Other
      // Note: mail.raw is empty for outbound emails. Could be set for forwarded emails, but deserves separate implementation

      // TODO: attachments

      envelope,

      // Extras to consider
      // encoding - transfer encoding
      // textEncoding: TextEncoding
      // attachDataUrls

      // nodemailer mode
      disableUrlAccess: true,
      disableFileAccess: true
    });
    return makeSuccess(undefined);
  }
);

function convertAddress(address: types.MailAddress): Mail.Address | string {
  if (address.name === undefined) {
    return address.address;
  }
  return {
    name: address.name,
    address: address.address
  };
}

function getAddressFromList(list: types.MailAddressList): Mail.Address | string | undefined {
  // TODO: Render the headers manually. nodemailer is limited

  // Get first address
  for (const address of list) {
    if ('address' in address) {
      return convertAddress(address);
    }
  }

  return undefined;
}

function convertAddressList(list: types.MailAddressList | undefined): (string | Mail.Address)[] | undefined {
  // TODO: Render the headers manually. nodemailer is limited

  const result: (string | Mail.Address)[] = [];

  // Get first address
  for (const item of list ?? []) {
    if ('groupName' in item) {
      for (const address of item.addresses) {
        result.push(convertAddress(address));
      }
    } else {
      result.push(convertAddress(item));
    }
  }

  return result.length > 0 ? result : undefined;
}
