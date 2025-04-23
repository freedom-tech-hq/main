import { makeFailure, type PR, type Result } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { ForbiddenError, InternalStateError, NotFoundError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { SMTPServerDataStream, SMTPServerOptions, SMTPServerSession } from 'smtp-server';
import { SMTPServer } from 'smtp-server';

import * as config from '../../../../config.ts';
import type { SmtpPublicErrorCodes } from '../types/SmtpPublicErrorCodes.ts';
import { wrapSmtpHandler } from './wrapSmtpHandler.ts';

export type SmtpServerParams = {
  secureOnly: boolean;
  onAuth: (trace: Trace, username: string, password: string) => PR<{ userId: string }, SmtpPublicErrorCodes>;
  onValidateReceiver: (trace: Trace, emailAddress: string) => PR<'our' | 'external' | 'wrong-user', SmtpPublicErrorCodes>;

  // TODO: check how we validate no promise here
  onReceivedEmail: (trace: Trace, emailData: string) => PR<undefined>;
  onSentEmail: (trace: Trace, userId: string, emailData: string) => PR<undefined>;

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
        wrapSmtpHandler(callback, async () => {
          console.log(`SMTP connection from [${session.remoteAddress}]`);
          // Accept all connections
          return makeSuccess(undefined);
        }),

      // Authentication handler
      onAuth: async (auth, session, callback) =>
        wrapSmtpHandler(callback, async () => {
          // Only allow authentication over TLS
          if (!session.secure) {
            return makeFailure<SmtpPublicErrorCodes>(
              new ForbiddenError(trace, {
                errorCode: 'require-tls',
                message: 'Authentication requires TLS connection'
              })
            );
          }

          // Use the provided auth handler
          const result = await onAuth(trace, auth.username ?? '', auth.password ?? '');
          if (!result.ok) {
            return result;
          }

          // Pass userId as session.user
          return makeSuccess({ user: result.value.userId });
        }),

      // Called when client issues MAIL FROM command
      onMailFrom: (address, _session, callback) =>
        wrapSmtpHandler(callback, async () => {
          console.log(`MAIL FROM: ${address.address}`);
          // Accept any sender (validation will be done downstream)
          return makeSuccess(undefined);
        }),

      // Called when client issues RCPT TO command
      onRcptTo: (address, session, callback) =>
        wrapSmtpHandler(callback, async () => {
          console.log(`RCPT TO: ${address.address}`);

          // For unauthenticated (incoming email), validate local receiver
          const validationResult = await onValidateReceiver(trace, address.address);
          if (!validationResult.ok) {
            return validationResult;
          }

          switch (validationResult.value) {
            case 'our':
              // Recipient is valid
              return makeSuccess(undefined);

            case 'external':
              // If authenticated, it is an outgoing email
              if (session.user !== undefined && session.user !== '') {
                return makeSuccess(undefined);
              }

              // Not our domain
              return makeFailure(
                new ForbiddenError(trace, {
                  errorCode: 'relay-denied',
                  message: `Relay denied: ${address.address} is not our domain`
                })
              );

            case 'wrong-user':
              // Our domain but user doesn't exist
              return makeFailure(
                new NotFoundError(trace, {
                  errorCode: 'user-not-found',
                  message: `User unknown: ${address.address} not found`
                })
              );

            default:
              // Should not happen
              return makeFailure(
                new InternalStateError(trace, {
                  message: `Unexpected validation result: ${validationResult as any}`
                })
              );
          }
        }),

      // Called when the client streams message data
      onData: (stream: SMTPServerDataStream, session, callback) =>
        wrapSmtpHandler(
          callback,
          () =>
            new Promise<Result<undefined, SmtpPublicErrorCodes>>((resolve) => {
              console.log('Receiving message data');
              // Trigger test callback
              onData?.();

              // Collect email data
              const chunks: Buffer[] = [];

              stream.on('data', (chunk: Buffer) => {
                chunks.push(chunk);
              });

              stream.on('end', async () => {
                try {
                  if (stream.sizeExceeded) {
                    resolve(
                      makeFailure(
                        new ForbiddenError(trace, {
                          errorCode: 'message-too-long',
                          message: 'Message exceeds fixed maximum message size'
                        })
                      )
                    );
                    return;
                  }

                  // Combine chunks into a single buffer and convert to string
                  const emailData = Buffer.concat(chunks).toString();
                  console.log(`Processing email`);

                  // Dispatch the email type
                  if (session.user !== undefined && session.user !== '') {
                    // User is authenticated = sending
                    const { user } = session;
                    spawnAsyncThread(trace, () => onSentEmail(trace, user, emailData));
                  } else {
                    // No authentication = receiving
                    spawnAsyncThread(trace, () => onReceivedEmail(trace, emailData));
                  }

                  console.log('Email processed successfully');
                  // Success
                  resolve(makeSuccess(undefined));
                } catch (error) {
                  // Convert
                  resolve(makeFailure(new GeneralError(trace, error)));
                }
              });

              stream.on('error', (error) => {
                console.error('Stream error:', error);
                resolve(
                  makeFailure(
                    new InternalStateError(trace, {
                      errorCode: 'stream-error',
                      message: 'Error during message transfer'
                    })
                  )
                );
              });
            })
        )
    };

    const server = new SMTPServer(serverOptions);

    // Set up error handling
    server.on('error', (err) => {
      console.error('SMTP Server error:', err);
    });

    return makeSuccess(server);
  }
);

// TODO: Extract to an utility package
function spawnAsyncThread(trace: Trace, handler: () => PR<undefined>) {
  handler()
    .catch((error) => {
      return makeFailure(new GeneralError(trace, error));
    })
    .then((value) => {
      if (!value.ok) {
        // TODO: Log or something
      }
    });
}
