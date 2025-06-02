import type { PR } from 'freedom-async';
import { debugTopic, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { makeIsoDateTime } from 'freedom-basic-data';
import { log, makeUuid } from 'freedom-contexts';
import { findUserByEmail } from 'freedom-db';
import { types } from 'freedom-email-api';
import { addIncomingEmail } from 'freedom-email-server';

import * as config from '../../../config.ts';
import type { ParsedMail } from '../../formats/types/ParsedMail.ts';
import { resolveMailAlias } from '../../forwarding/exports.ts';
import { deliverOutboundEmail } from '../../smtp-upstream/exports.ts';
import { deliverForwardedEmail } from '../../smtp-upstream/utils/deliverForwardedEmail.ts';

/**
 * Routes an email message to internal and external recipients
 */
export const routeMail = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    {
      recipients,
      mail,
      mode
    }: {
      recipients: Set<string>;
      mail: ParsedMail;
      // Different modes assume different policies
      mode:
        | {
            type: 'inbound';
            rawMail: string;
          }
        | {
            type: 'outbound';
            userEmail: string; // Validated, from the DB
          };
    }
  ): PR<undefined> => {
    // Separate internal and external recipients
    const internalRecipients: string[] = [];
    const externalRecipients: string[] = [];
    const externalForwardingRecipients: Record<string, string[]> = {};

    for (const denotedRecipient of recipients) {
      // Resolve alias
      const recipient = resolveMailAlias(denotedRecipient);

      // Classify
      const [, domain] = recipient.split('@');
      if (domain.length > 0 && config.SMTP_OUR_DOMAINS.includes(domain)) {
        // Internal target
        internalRecipients.push(recipient);
      } else if (recipient !== denotedRecipient) {
        // Forwarding
        if (mode.type === 'inbound') {
          // This adds headers on forwarding. Requires rawMail
          if (externalForwardingRecipients[denotedRecipient] === undefined) {
            externalForwardingRecipients[denotedRecipient] = [];
          }
          externalForwardingRecipients[denotedRecipient].push(recipient);
        } else {
          // Outgoing forwarding is the same as direct delivery
          externalRecipients.push(recipient);
        }

        // Check if there's a user for the denoted recipient
        const userResult = await findUserByEmail(trace, denotedRecipient);
        if (userResult.ok) {
          // Save a copy as well
          internalRecipients.push(denotedRecipient);
        }
      } else {
        if (mode.type === 'inbound') {
          // This should not happen if the calling code is correct, so no need for feedback
          // Illegal relay attempts should be bounced one level above. Here it is just an extra safety check
          log().error?.('routeEmailMessage got external recipient in the incoming scenario');
          continue;
        }

        // Outbound scenario
        externalRecipients.push(recipient);
      }
    }

    // Note: Not sure if we need to parallelize this. It is always a background process to any user.

    // Internal recipients
    for (const recipient of internalRecipients) {
      DEV: debugTopic('SMTP', (log) => log(trace, `Processing internal recipient: ${recipient}`));

      await addIncomingEmail(trace, recipient, {
        ...mail,
        // TODO: Extract a function
        // TODO: Remove time from the id. transferredAt is server-controlled
        id: types.mailIdInfo.make(`${makeIsoDateTime(new Date())}-${makeUuid()}`)
      });
    }

    // External recipients
    if (externalRecipients.length > 0) {
      if (mode.type === 'inbound') {
        // Should not happen
        log().error?.('routeEmailMessage is internally inconsistent');
      } else {
        DEV: debugTopic('SMTP', (log) => log(trace, `Processing ${externalRecipients.length} external recipients`));

        // Post to SMTP upstream
        // TODO: Validate the 'from' field to match the user. Bounce on violation
        await deliverOutboundEmail(trace, mail, {
          from: mode.userEmail,
          to: externalRecipients.join(',')
        });
      }
    }

    // External forwarding recipients
    for (const ourEmailAlias of Object.keys(externalForwardingRecipients)) {
      const recipients = externalForwardingRecipients[ourEmailAlias];

      DEV: debugTopic('SMTP', (log) => log(trace, `Processing ${recipients.length} external forwarding recipients`));

      if (mode.type !== 'inbound') {
        // Should not happen
        log().error?.('routeEmailMessage is internally inconsistent');
      } else {
        // Add headers and post to SMTP upstream
        // TODO: Do not parse if we only forward it
        await deliverForwardedEmail(trace, {
          rawMail: mode.rawMail,
          envelope: {
            from: ourEmailAlias, // Note, this is envelope, not the 'From' header
            to: recipients.join(',')
          },
          forwardingParams: {
            ourEmailAlias,
            targetEmails: recipients
          }
        });
      }
    }

    return makeSuccess(undefined);
  }
);
