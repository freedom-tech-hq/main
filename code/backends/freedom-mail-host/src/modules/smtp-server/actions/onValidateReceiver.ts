import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';

import * as config from '../../../config.ts';
import { SmtpPublicError } from '../internal/types/SmtpPublicError.ts';
import type { SmtpServerParams } from '../internal/utils/defineSmtpServer.ts';

/**
 * Validates an email recipient to determine if it's a valid recipient
 *
 * @param trace - Trace for async operations
 * @param emailAddress - The email address to validate
 * @returns PR resolving to 'our' (valid local user), 'external' (external domain), or 'wrong-user' (invalid user)
 */
export const onValidateReceiver: SmtpServerParams['onValidateReceiver'] = makeAsyncResultFunc(
  [import.meta.filename],
  async (_trace, emailAddress: string): PR<'our' | 'external' | 'wrong-user'> => {
    // Get the domain part of the email
    const [localPart, domain] = emailAddress.split('@');

    if (!domain) {
      throw new SmtpPublicError(550, `Malformed email address: '${emailAddress}'`);
    }

    // Not our domain
    if (!config.SMTP_OUR_DOMAINS.includes(domain)) {
      return makeSuccess('external' as const);
    }

    // Check if the user exists in our system
    // TODO: Replace with actual user validation from database
    // For now, just a simple check for testing purposes
    if (localPart.startsWith('invalid-')) {
      return makeSuccess('wrong-user' as const);
    }

    return makeSuccess('our' as const);
  }
);
