import type { SMTPServer } from 'smtp-server';

import { onAuth } from '../actions/onAuth.ts';
import { onReceivedEmail } from '../actions/onReceivedEmail.ts';
import { onSentEmail } from '../actions/onSentEmail.ts';
import { onValidateReceiver } from '../actions/onValidateReceiver.ts';
import { defineSmtpServer } from '../internal/utils/defineSmtpServer.ts';

/**
 * Connects a generic SMTP server instance with handlers
 * @param secureOnly - Enforce TLS or accept all
 * @returns An SMTP server instance configured and ready to listen
 */
export function assembleSmtpServer(secureOnly: boolean): SMTPServer {
  // Define the SMTP server
  return defineSmtpServer({
    secureOnly,
    onAuth,
    onValidateReceiver,
    onReceivedEmail,
    onSentEmail
  });
}
