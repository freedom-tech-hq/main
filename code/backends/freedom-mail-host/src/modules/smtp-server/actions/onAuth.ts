import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure } from 'freedom-async';
import { ForbiddenError } from 'freedom-common-errors';

import type { SmtpServerParams } from '../internal/utils/defineSmtpServer.ts';

/**
 * Authentication handler for SMTP server
 *
 * @param trace - Trace for async operations
 * @param username - SMTP auth username
 * @param password - SMTP auth password (unused in current implementation)
 * @returns PR resolving to authentication result with userId
 */
export const onAuth: SmtpServerParams['onAuth'] = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, _username: string, _password: string): PR<{ userId: string }> => {
    return makeFailure(
      new ForbiddenError(trace, {
        message: 'This server only accepts inbound mail. To send an email use Freedom Email app over a Syncable Store'
      })
    );
  }
);
