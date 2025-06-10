import { makeFailure, type PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult, InternalStateError } from 'freedom-common-errors';
import { findUserByEmail } from 'freedom-db';

import * as config from '../../../config.ts';
import { interpretMailAddress, type InterpretMailAddressResult } from '../../forwarding/utils/interpretMailAddress.ts';
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
    const interpretedResult = await interpretMailAddress(trace, emailAddress, config);
    if (!interpretedResult.ok) {
      return interpretedResult;
    }

    switch (interpretedResult.value.type) {
      case 'our':
      case 'forwarding-our': {
        // Check the user exists
        const userResult = await findUserByEmail(trace, interpretedResult.value.target);
        if (userResult.ok) {
          return makeSuccess<ValidateReceiverResult>('our');
        } else if (userResult.value.errorCode === 'not-found') {
          return makeSuccess<ValidateReceiverResult>('wrong-user');
        } else {
          return generalizeFailureResult(trace, userResult, 'not-found');
        }
      }

      // The address is ours, destination is the onReceivedEmail's concern
      case 'forwarding-external':
        return makeSuccess<ValidateReceiverResult>('our');

      // This one is really external
      case 'external':
        return makeSuccess<ValidateReceiverResult>('external');

      default:
        return makeFailure(
          new InternalStateError(trace, {
            message: `Unexpected address type: ${(interpretedResult.value as InterpretMailAddressResult).type}`
          })
        );
    }
  }
);
