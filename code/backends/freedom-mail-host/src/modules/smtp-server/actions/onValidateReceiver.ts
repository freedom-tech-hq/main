import { makeFailure, type PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult, NotFoundError } from 'freedom-common-errors';
import { findUserByEmail } from 'freedom-db';

import * as config from '../../../config.ts';
import { hasForwardingRoute } from '../../forwarding/exports.ts';
import type { SmtpPublicErrorCodes } from '../internal/types/SmtpPublicErrorCodes.ts';
import type { SmtpServerParams, ValidateReceiverResult } from '../internal/utils/defineSmtpServer.ts';

/**
 * Validates an email recipient to determine if it's a valid recipient
 *
 * @param trace - Trace for async operations
 * @param emailAddress - The email address to validate
 * @returns PR resolving to 'our' (valid local user), 'external' (external domain), or 'wrong-user' (invalid user)
 */
export const onValidateReceiver: SmtpServerParams['onValidateReceiver'] = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, emailAddress: string): PR<ValidateReceiverResult, SmtpPublicErrorCodes> => {
    // Get the domain part of the email
    const [, domain] = emailAddress.split('@');

    if (domain.length === 0) {
      return makeFailure(
        new NotFoundError(trace, {
          errorCode: 'malformed-email-address',
          message: `Malformed email address: '${emailAddress}'`
        })
      );
    }

    // Not our domain
    if (!config.SMTP_OUR_DOMAINS.includes(domain)) {
      return makeSuccess<ValidateReceiverResult>('external');
    }

    // Check a forwarding route exists
    if (hasForwardingRoute(emailAddress)) {
      return makeSuccess<ValidateReceiverResult>('our'); // address is ours, destination is the onReceivedEmail concern
    }

    // Check the user exists
    const userResult = await findUserByEmail(trace, emailAddress);
    if (userResult.ok) {
      return makeSuccess<ValidateReceiverResult>('our');
    } else if (userResult.value.errorCode === 'not-found') {
      return makeSuccess<ValidateReceiverResult>('wrong-user');
    } else {
      return generalizeFailureResult(trace, userResult, 'not-found');
    }
  }
);
