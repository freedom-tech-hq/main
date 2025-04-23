import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';

import { processInboundEmail } from '../../syncable-store/utils/processInboundEmail.ts';
import type { SmtpServerParams } from '../internal/utils/defineSmtpServer.ts';

/**
 * Handler for received emails (no authentication)
 *
 * @param trace - Trace for async operations
 * @param emailData - The email data to process as a string
 * @returns PR resolving when the email is processed
 */
export const onReceivedEmail: SmtpServerParams['onReceivedEmail'] = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, emailData: string): PR<void> => {
    return await processInboundEmail(trace, emailData);
  }
);
