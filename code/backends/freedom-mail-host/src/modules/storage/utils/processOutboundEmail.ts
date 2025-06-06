import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';

import { getEmailsFromMailAddressList } from '../../formats/utils/getEmailsFromMailAddressList.ts';
import type { OutboundEmailHandlerArgs } from '../../storage/types/OutboundEmailHandlerArgs.ts';
import { routeMail } from './routeMail.ts';

/**
 * Pub/sub handler for outbound emails
 */
export const processOutboundEmail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { user, message: mail }: OutboundEmailHandlerArgs): PR<undefined> => {
    // console.log(`processOutboundEmail: Sending outbound email ${mailId}`);

    // TODO: Validate the email, ensure our users do not forge their 'From' and other
    // mail.from = user.email;

    // Route the email to be delivered
    const recipients = new Set<string>([
      // TODO: Revise the format. 'TO' is not an array of strings in the mail itself,
      //  but it should be an array of plain email addresses in the envelope
      ...getEmailsFromMailAddressList(mail.to),
      ...getEmailsFromMailAddressList(mail.cc),
      ...getEmailsFromMailAddressList(mail.bcc)
    ]);

    // console.log(`processOutboundEmail: Routing`, mail, `to`, recipients);
    const routeResult = await routeMail(trace, {
      recipients,
      mail,
      mode: {
        type: 'outbound',
        userEmail: user.email
      }
    });
    if (!routeResult.ok) {
      return routeResult;
    }
    // console.log(`processOutboundEmail: Sent outbound email ${mailId}`);

    return makeSuccess(undefined);
  }
);
