import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { SMTPServer } from 'smtp-server';

import { onAuth } from '../actions/onAuth.ts';
import { onReceivedEmail } from '../actions/onReceivedEmail.ts';
import { onSentEmail } from '../actions/onSentEmail.ts';
import { onValidateReceiver } from '../actions/onValidateReceiver.ts';
import { defineSmtpServer } from '../internal/utils/defineSmtpServer.ts';

/**
 * Connects a generic SMTP server instance with handlers
 *
 * @param trace - Trace for async operations
 * @param secureOnly - Enforce TLS or accept all
 * @returns PR resolving to an SMTP server instance configured and ready to listen
 */
export const assembleSmtpServer = makeAsyncResultFunc([import.meta.filename], async (trace: Trace, secureOnly: boolean): PR<SMTPServer> => {
  // Connect generic server to the actions
  return await defineSmtpServer(trace, {
    secureOnly,
    onAuth,
    onValidateReceiver,
    onReceivedEmail,
    onSentEmail
  });
});
