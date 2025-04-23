import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';

import type { SmtpServerParams } from '../internal/utils/defineSmtpServer.ts';

/**
 * Handler for sent emails (with authentication)
 *
 * @param trace - Trace for async operations
 * @param userId - The authenticated user ID
 * @param emailData - The email data to process as a string
 * @returns PR resolving when the email is processed
 */
export const onSentEmail: SmtpServerParams['onSentEmail'] = makeAsyncResultFunc(
  [import.meta.filename],
  async (_trace, _userId: string, _emailData: string): PR<undefined> => {
    // Note: this should be aligned with onAuth
    throw new Error("Not implemented. We probably don't need it as the outgoing emails should come only from the store");
  }
);
