import { startSubscriptions } from './modules/email-encoder/utils/startSubscriptions.ts';
import { startSmtpServer } from './modules/smtp-server/utils/startSmtpServer.ts';

async function main() {
  // Start SMTP server for receiving emails directly
  await startSmtpServer();

  // Start subscriptions for processing outbound emails
  await startSubscriptions();
}

// Entrypoint
main().catch((error) => {
  console.error('Failed to start servers:', error);
  process.exit(1);
});
