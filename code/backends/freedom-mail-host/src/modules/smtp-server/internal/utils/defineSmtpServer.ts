import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { SMTPServerDataStream, SMTPServerOptions, SMTPServerSession } from 'smtp-server';
import { SMTPServer } from 'smtp-server';

import * as config from '../../../../config.ts';
import { SmtpPublicError } from '../types/SmtpPublicError.ts';
import { catchSmtpError } from './catchSmtpError.ts';

export type SmtpServerParams = {
  secureOnly: boolean;
  onAuth: (trace: Trace, username: string, password: string) => PR<{ userId: string }>;
  onValidateReceiver: (trace: Trace, emailAddress: string) => PR<'our' | 'external' | 'wrong-user'>;
  onReceivedEmail: (trace: Trace, emailData: string) => void;
  onSentEmail: (trace: Trace, userId: string, emailData: string) => void;

  // Test only. Use onReceivedEmail and onSentEmail instead
  onData?: () => void;
};

/**
 * Creates and configures a generic SMTP server, subsetting for testability the features of smtp-server to what we need.
 * Actions are connected in assembleSmtpServer()
 *
 * @param trace - Trace for async operations
 * @param options - Configuration parameters for the SMTP server
 * @returns PR resolving to an SMTP server instance
 */
export const defineSmtpServer = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { secureOnly, onAuth, onValidateReceiver, onReceivedEmail, onSentEmail, onData }: SmtpServerParams): PR<SMTPServer> => {
    const serverOptions: SMTPServerOptions = {
      // Control whether to only allow secure connections
      secure: secureOnly,
      key: config.SMTP_TLS_KEY_RAW,
      cert: config.SMTP_TLS_CERT_RAW,

      // Inbound email comes from foreign servers (until a filtering proxy is implemented)
      authOptional: true,
      // Allow authentication only over TLS
      allowInsecureAuth: false,

      // Announce size limit (the implementation is manual)
      size: config.SMTP_MAX_EMAIL_SIZE,

      // Called when a client connects to the server
      onConnect: (session: SMTPServerSession, callback) =>
        catchSmtpError(callback, async () => {
          console.log(`SMTP connection from [${session.remoteAddress}]`);
          // Accept all connections
          callback();
        }),

      // Authentication handler
      onAuth: async (auth, session, callback) => {
        // Only allow authentication over TLS
        if (!session.secure) {
          return callback(new SmtpPublicError(538, 'Authentication requires TLS connection'));
        }

        // Use the provided auth handler
        const result = await onAuth(trace, auth.username ?? '', auth.password ?? '');
        if (!result.ok) {
          return callback(result.value);
        }

        // Pass userId as session.user
        return callback(null, { user: result.value.userId });
      },

      // Called when client issues MAIL FROM command
      onMailFrom: (address, _session, callback) =>
        catchSmtpError(callback, async () => {
          console.log(`MAIL FROM: ${address.address}`);
          // Accept any sender (validation will be done downstream)
          callback();
        }),

      // Called when client issues RCPT TO command
      onRcptTo: (address, session, callback) =>
        catchSmtpError(callback, async () => {
          console.log(`RCPT TO: ${address.address}`);

          // For unauthenticated (incoming email), validate local receiver
          const validationResult = await onValidateReceiver(trace, address.address);
          if (!validationResult.ok) {
            return callback(validationResult.value);
          }

          switch (validationResult.value) {
            case 'our':
              // Recipient is valid
              callback();
              break;

            case 'external':
              // If authenticated, it is an outgoing email
              if (session.user !== undefined && session.user !== '') {
                callback();
                return;
              }

              // Not our domain
              callback(new SmtpPublicError(550, `Relay denied: ${address.address} is not our domain`));
              break;

            case 'wrong-user':
              // Our domain but user doesn't exist
              callback(new SmtpPublicError(550, `User unknown: ${address.address} not found`));
              break;

            default:
              // Handle unexpected validation result
              console.error(`Unexpected validation result: ${validationResult as any}`);
              callback(new SmtpPublicError(451, 'Internal server error'));
          }
        }),

      // Called when the client streams message data
      onData: (stream: SMTPServerDataStream, session, callback) =>
        catchSmtpError(callback, async () => {
          console.log('Receiving message data');
          onData?.();

          // Collect email data
          const chunks: Buffer[] = [];

          stream.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
          });

          stream.on('end', async () => {
            if (stream.sizeExceeded) {
              return callback(new SmtpPublicError(522, 'Message exceeds fixed maximum message size'));
            }

            try {
              // Combine chunks into a single buffer and convert to string
              const emailData = Buffer.concat(chunks).toString();
              console.log(`Processing email`);

              // Dispatch the email type
              if (session.user !== undefined && session.user !== '') {
                // User is authenticated = sending
                onSentEmail(trace, session.user, emailData);
              } else {
                // No authentication = receiving
                onReceivedEmail(trace, emailData);
              }

              console.log('Email processed successfully');
              // Success
              callback();
            } catch (error) {
              console.error('Error processing email:', error);
              // Error processing email
              callback(new Error(`Error processing email: TODO: {stringify error}`));
            }
          });

          stream.on('error', (error) => {
            console.error('Stream error:', error);
            callback(new SmtpPublicError(451, 'Error during message transfer'));
          });
        })
    };

    const server = new SMTPServer(serverOptions);

    // Set up error handling
    server.on('error', (err) => {
      console.error('SMTP Server error:', err);
    });

    return makeSuccess(server);
  }
);
