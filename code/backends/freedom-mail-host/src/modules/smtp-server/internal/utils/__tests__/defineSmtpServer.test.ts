import { afterEach, describe, mock, test } from 'node:test';
import { SMTPServer } from 'smtp-server';
import { PassThrough } from 'stream';
import { defineSmtpServer } from '../defineSmtpServer.ts';
import type { SmtpServerParams } from '../defineSmtpServer.ts';
import nodemailer from 'nodemailer';
import { expect } from 'expect';
import * as config from '../../../../../config.ts';
import SMTPConnection from 'nodemailer/lib/smtp-connection/index.js';
import { promisify } from 'node:util';

const PORT = 3025; // Use a non-standard port for testing. TODO: consider also a runner ID
let server: SMTPServer | undefined;

async function spinOffServerStack({
  serverSecureOnly = false,
  authenticateSender = false,
  clientSecure = false,
  clientRequireTls = false,
}: {
  serverSecureOnly?: boolean;
  authenticateSender?: boolean;
  clientSecure?: boolean;
  clientRequireTls?: boolean;
} = {}) {
  // Assert values
  const sideEffects = {
    authCalledTimes: 0,
    validateReceiverCalledTimes: 0,

    // Emails are split into lines for granular control in expect().toStrictEqual()
    received: [] as string[][],
    sent: [] as string[][]
  }

  // Mocks
  const onAuth = mock.fn<SmtpServerParams['onAuth']>(async () => {
    return { userId: 'the-user-id' };
  })
  const onValidateReceiver = mock.fn<SmtpServerParams['onValidateReceiver']>(async () => {
    return 'our';
  })
  const onReceivedEmail = mock.fn<SmtpServerParams['onReceivedEmail']>();
  const onSentEmail = mock.fn<SmtpServerParams['onSentEmail']>();

  // Stage promises
  let resolveOnData: (() => void) | undefined;
  const onDataPromise = new Promise<void>((resolve) => {
    resolveOnData = resolve;
  })

  // Server
  server = defineSmtpServer({
    secureOnly: serverSecureOnly,
    onAuth: (username, password) => {
      sideEffects.authCalledTimes++;
      return onAuth(username, password);
    },
    onValidateReceiver: (emailAddress) => {
      sideEffects.validateReceiverCalledTimes++;
      return onValidateReceiver(emailAddress);
    },
    onReceivedEmail: (emailData) => {
      sideEffects.received.push(emailData.split('\r\n'));
      onReceivedEmail(emailData);
    },
    onSentEmail: (userId, emailData) => {
      sideEffects.sent.push(emailData.split('\r\n'));
      onSentEmail(userId, emailData);
    },
    onData: () => {
      resolveOnData!();
    }
  });

  // Define a completion marker
  // Note: no need so far, because the connection is handled in real time.
  // So when sendMail() exits, the server is already done.
  // const requestCompleted = new Promise<void>((resolve) => {
  //   server!.on('close', () => {
  //     resolve();
  //   });
  // });

  // Listen
  await new Promise<void>((resolve, reject) => {
    server!.listen(PORT, () => {
      resolve();
    });

    server!.on('error', (err) => {
      reject(err);
    });
  });

  // Create a nodemailer transport
  const client = nodemailer.createTransport({
    port: PORT,
    host: '127.0.0.1',

    auth: authenticateSender ? {
      user: 'sender@example.com',
      pass: 'the-password'
    } : undefined,

    // TLS options
    secure: clientSecure,
    requireTLS: clientRequireTls,
    tls: {
      // Accept self-signed certificates
      rejectUnauthorized: false
    },
  });

  return {
    // Arrange + extra assert
    onAuth,
    onValidateReceiver,
    onReceivedEmail,
    onSentEmail,

    // Act
    client,
    onDataPromise,

    // Assert
    sideEffects,
  }
}

describe('defineSmtpServer', () => {
  afterEach(() => {
    server?.close();
    server = undefined;
  });

  describe('[inbound] An inbound email is received from another server', () => {
    test('[inbound.plain] Deliver a plain email to our user', async () => {
      // Arrange
      const { client, sideEffects } = await spinOffServerStack();

      // Act
      await client.sendMail({
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Email',
        text: 'This is a test email to verify SMTP server functionality'
      });

      // Assert
      expect(sideEffects).toStrictEqual({
        authCalledTimes: 0,
        validateReceiverCalledTimes: 1,
        received: [[
          'From: sender@example.com',
          'To: recipient@example.com',
          'Subject: Test Email',
          expect.stringMatching(/^Message-ID: <[0-9a-f-]+@example.com>$/),
          'Content-Transfer-Encoding: 7bit',
          expect.stringMatching(/^Date: .+? \+0000$/),
          'MIME-Version: 1.0',
          'Content-Type: text/plain; charset=utf-8',
          '',
          'This is a test email to verify SMTP server functionality',
          '',
        ]],
        sent: []
      });
    });

    test('[inbound.plain.cc] Deliver to our user in Cc', async () => {
      // Arrange
      const { client, sideEffects } = await spinOffServerStack();

      // Act
      await client.sendMail({
        from: 'sender@example.com',
        cc: 'recipient@example.com',
        subject: 'Test Email',
        text: 'This is a test email to verify SMTP server functionality'
      });

      // Assert
      expect(sideEffects).toStrictEqual({
        authCalledTimes: 0,
        validateReceiverCalledTimes: 1,
        received: [[
          'From: sender@example.com',
          'Cc: recipient@example.com',
          'Subject: Test Email',
          expect.stringMatching(/^Message-ID: <[0-9a-f-]+@example.com>$/),
          'Content-Transfer-Encoding: 7bit',
          expect.stringMatching(/^Date: .+? \+0000$/),
          'MIME-Version: 1.0',
          'Content-Type: text/plain; charset=utf-8',
          '',
          'This is a test email to verify SMTP server functionality',
          '',
        ]],
        sent: []
      });
    });

    test('[inbound.plain.bcc] Deliver to our user in Bcc', async () => {
      // Arrange
      const { client, sideEffects } = await spinOffServerStack();

      // Act
      await client.sendMail({
        from: 'sender@example.com',
        bcc: 'recipient@example.com',
        subject: 'Test Email',
        text: 'This is a test email to verify SMTP server functionality'
      });

      // Assert
      expect(sideEffects).toStrictEqual({
        authCalledTimes: 0,
        validateReceiverCalledTimes: 1,
        received: [[
          'From: sender@example.com',
          // Not visible in the email // 'Bcc: recipient@example.com',
          'Subject: Test Email',
          expect.stringMatching(/^Message-ID: <[0-9a-f-]+@example.com>$/),
          'Content-Transfer-Encoding: 7bit',
          expect.stringMatching(/^Date: .+? \+0000$/),
          'MIME-Version: 1.0',
          'Content-Type: text/plain; charset=utf-8',
          '',
          'This is a test email to verify SMTP server functionality',
          '',
        ]],
        sent: []
      });
    });

    test('[inbound.negative.user] Reject email from outside to our domain but wrong user', async () => {
      // Arrange
      const { client, sideEffects, onValidateReceiver } = await spinOffServerStack();
      onValidateReceiver.mock.mockImplementationOnce(async () => 'wrong-user');

      // Act
      const clientResult = client.sendMail({
        from: 'sender@example.com',
        to: 'nonexistent@ourdomain.com',
        subject: 'Test Email',
        text: 'This is a test email to a non-existent user'
      })

      // Assert
      await expect(clientResult).rejects.toThrow(
        "Can't send mail - all recipients were rejected: 550 User unknown: nonexistent@ourdomain.com not found"
      );

      expect(sideEffects).toStrictEqual({
        authCalledTimes: 0,
        validateReceiverCalledTimes: 1,
        received: [],
        sent: []
      });
    });

    test('[inbound.negative.domain] Reject email from outside to non-our domain', async () => {
      // Arrange
      const { client, sideEffects, onValidateReceiver } = await spinOffServerStack();
      onValidateReceiver.mock.mockImplementationOnce(async () => 'external');

      // Act
      const clientResult = client.sendMail({
        from: 'sender@example.com',
        to: 'recipient@external-domain.com',
        subject: 'Test Email',
        text: 'This is a test email to an external domain'
      });

      // Assert
      await expect(clientResult).rejects.toThrow(
        "Can't send mail - all recipients were rejected: 550 Relay denied: recipient@external-domain.com is not our domain"
      );

      expect(sideEffects).toStrictEqual({
        authCalledTimes: 0,
        validateReceiverCalledTimes: 1,
        received: [],
        sent: []
      });
    });

    test('[inbound.mixed.rcpt] Process when To header contains a mix of valid and invalid addresses', async () => {
      // Arrange
      const { client, sideEffects, onValidateReceiver } = await spinOffServerStack();

      // Set up mock responses for different email addresses
      const addressResponses = new Map<string, 'our' | 'external' | 'wrong-user'>([
        ['valid-user@example.com', 'our'],
        ['invalid-user@example.com', 'wrong-user'],
        ['user@external-domain.com', 'external'],
        ['valid-cc-user@example.com', 'our'],
        ['invalid-cc-user@example.com', 'wrong-user'],
        ['cc-user@external-domain.com', 'external'],
        ['valid-bcc-user@example.com', 'our'],
        ['invalid-bcc-user@example.com', 'wrong-user'],
        ['bcc-user@external-domain.com', 'external']
      ]);

      // Mock the validation function to return appropriate responses
      onValidateReceiver.mock.mockImplementation(async (email): Promise<'our' | 'external' | 'wrong-user'> => {
        const result = addressResponses.get(email);
        if (!result) {
          throw new Error(`Unexpected email address: ${email}`);
        }
        return result;
      });

      // Act
      await client.sendMail({
        from: 'sender@external-source.com',
        to: [
          'valid-user@example.com',          // Our user
          'invalid-user@example.com',        // Our domain, not a user
          'user@external-domain.com'         // Not our domain
        ],
        cc: [
          'valid-cc-user@example.com',       // Our user
          'invalid-cc-user@example.com',     // Our domain, not a user
          'cc-user@external-domain.com'      // Not our domain
        ],
        bcc: [
          'valid-bcc-user@example.com',      // Our user
          'invalid-bcc-user@example.com',    // Our domain, not a user
          'bcc-user@external-domain.com'     // Not our domain
        ],
        subject: 'Mixed Recipients Test',
        text: 'This email has both valid and invalid recipients'
      });

      // Assert
      expect(sideEffects).toStrictEqual({
        authCalledTimes: 0,
        validateReceiverCalledTimes: 9,
        received: [[
          'From: sender@external-source.com',
          "To: valid-user@example.com, invalid-user@example.com,",
          " user@external-domain.com", // formatting, sic!
          "Cc: valid-cc-user@example.com, invalid-cc-user@example.com,",
          " cc-user@external-domain.com", // same here
          'Subject: Mixed Recipients Test',
          expect.stringMatching(/^Message-ID: <[0-9a-f-]+@external-source.com>$/),
          'Content-Transfer-Encoding: 7bit',
          expect.stringMatching(/^Date: .+? \+0000$/),
          'MIME-Version: 1.0',
          'Content-Type: text/plain; charset=utf-8',
          '',
          'This email has both valid and invalid recipients',
          '',
        ]],
        sent: []
      });
    });

    test.todo('[inbound.negative.from] Reject when FROM command and From header are different');

    test('[inbound.negative.too-big] Reject when the size of email is too big', async () => {
      // Arrange
      const { client, sideEffects } = await spinOffServerStack();

      // Act
      const clientResult = client.sendMail({
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Large Test Email',
        text: 'A'.repeat(config.SMTP_MAX_EMAIL_SIZE + 1000)
      });

      // Assert
      await expect(clientResult).rejects.toThrow(
        "Message failed: 522 Message exceeds fixed maximum message size"
      );

      expect(sideEffects).toStrictEqual({
        authCalledTimes: 0,
        validateReceiverCalledTimes: 1,
        received: [],
        sent: []
      });
    });

    test('[inbound.negative.interrupt] Handle interrupted body transfer gracefully', async () => {
      // Arrange
      const { onDataPromise, sideEffects } = await spinOffServerStack();

      const connection = new SMTPConnection({
        port: PORT,
        host: '127.0.0.1',
        secure: false,
      });
      const stream = new PassThrough();

      let serverErrorEmitted = false;
      const onErrorPromise = new Promise<void>((resolve) => {
        server!.on('error', () => {
          serverErrorEmitted = true;
          resolve();
        });
      });

      // Act
      // Connect and start sending the email
      await promisify(connection.connect).call(connection);
      connection.send(
        {
          from: 'sender@example.com',
          to: ['recipient@example.com']
        },
        stream,
        () => { }
      );

      // Write partial data
      stream.write('Subject: Test Email\r\n\r\nPartial body');
      await onDataPromise; // Wait for server

      // Interrupt the connection
      connection._socket.removeAllListeners(); // Prevent the client from crashing the test with unhandled exception
      expect(serverErrorEmitted).toBe(false); // Sanity check
      connection._socket.destroy();
      await onErrorPromise; // Wait for server

      // Assert
      // No client assertions in this scenario, only server
      expect(serverErrorEmitted).toBe(true);
      expect(sideEffects).toStrictEqual({
        authCalledTimes: 0,
        validateReceiverCalledTimes: 1,
        received: [],
        sent: []
      });
    });

    test('[inbound.negative.internal-error] Handle internal server error gracefully', async () => {
      // Arrange
      const { client, sideEffects, onValidateReceiver } = await spinOffServerStack();
      onValidateReceiver.mock.mockImplementationOnce(async () => {
        await Promise.resolve(); // Make it next tick to be sure it is async
        throw new Error('Irrelevant error');
      });

      // Act
      const clientResult = client.sendMail({
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Email',
        text: 'This email should trigger an internal error'
      });

      // Assert
      await expect(clientResult).rejects.toThrow(
        "Can't send mail - all recipients were rejected: 451 Internal server error"
      );

      expect(sideEffects).toStrictEqual({
        authCalledTimes: 0,
        validateReceiverCalledTimes: 1,
        received: [],
        sent: []
      });
    });

    test.todo('[inbound.pgp] Deliver a PGP-encrypted email to our user');
  });

  // IMPORTANT: Do not remove these tests even if the mode is not used by the product.
  // They work in contrast to inbound and ensure that the SMTP server protection is correctly configured.
  describe('[outbound] An email is sent by our user', () => {
    describe('[outbound.plain] Send a plain email to external user', () => {
      for (const [serverSecureOnly, clientSecure, clientRequireTls, expectError] of [
        // TLS connection
        [true, true, true, null],
        [true, true, false, null],

        // The client attempts to communicate while the server is waiting for immediate TLS. It hangs up
        // [true, false, true, null],
        // [true, false, false, null],

        // Client TLS intention fails as the server expects plain + STARTTLS
        [false, true, true, 'routines:ssl3_get_record:wrong version number'],
        [false, true, false, 'routines:ssl3_get_record:wrong version number'],

        // Plain connection and STARTTLS
        [false, false, true, null],

        // Plain connection
        [false, false, false, 'Invalid login: 535 Authentication requires TLS connection'],
      ] as const) {
        test(
          [
            `${serverSecureOnly ? 'serverSecureOnly' : '-'}`,
            `${clientSecure ? 'clientSecure' : '-'}`,
            `${clientRequireTls ? 'clientRequireTls' : '-'}`,
          ].join(' '),
          async () => {
          // Arrange
          const { client, sideEffects, onValidateReceiver } = await spinOffServerStack({
            serverSecureOnly,
            authenticateSender: true,
            clientSecure,
            clientRequireTls,
          });
          onValidateReceiver.mock.mockImplementationOnce(async () => 'external');

          // Act
          const clientResult = client.sendMail({
            from: 'sender@example.com',
            to: 'recipient@external-domain.com',
            subject: 'Test Email',
            text: 'This is a test email to an external domain'
          });

          // Assert
          if (expectError) {
            await expect(clientResult).rejects.toThrow(expectError);
          } else {
            await clientResult;
            expect(sideEffects).toStrictEqual({
              authCalledTimes: 1,
              validateReceiverCalledTimes: 1,
              received: [],
              sent: [[
                'From: sender@example.com',
                'To: recipient@external-domain.com',
                'Subject: Test Email',
                expect.stringMatching(/^Message-ID: <[0-9a-f-]+@example.com>$/),
                'Content-Transfer-Encoding: 7bit',
                expect.stringMatching(/^Date: .+? \+0000$/),
                'MIME-Version: 1.0',
                'Content-Type: text/plain; charset=utf-8',
                '',
                'This is a test email to an external domain',
                '',
              ]]
            });
          }
        });
      }
    });

    test('[outbound.negative.wrong-credentials] Reject wrong user credentials', async () => {
      // Arrange
      const { client, sideEffects, onAuth } = await spinOffServerStack({
        serverSecureOnly: true,
        clientSecure: true,
        authenticateSender: true
      });

      onAuth.mock.mockImplementationOnce(async () => {
        return { error: 'Invalid authentication' };
      });

      // Act
      const clientResult = client.sendMail({
        from: 'sender@example.com',
        to: 'recipient@external-domain.com',
        subject: 'Test Email',
        text: 'This is a test email to an external domain'
      });

      // Assert
      await expect(clientResult).rejects.toThrow(
        "Invalid login: 535 Invalid authentication"
      );

      expect(sideEffects).toStrictEqual({
        authCalledTimes: 1,
        validateReceiverCalledTimes: 0,
        received: [],
        sent: []
      });
    });

    test.todo('[outbound.mixed.rcpt]** Process when To header contains a mix of valid and invalid addresses');
  });
});
