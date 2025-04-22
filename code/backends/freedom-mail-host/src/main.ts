import { startSmtpServer } from './modules/smtp-server/utils/startSmtpServer.ts';
import { startSubscriptions } from './modules/email-encoder/utils/startSubscriptions.ts';

async function main() {
  // Start HTTP server for API endpoints
  // await startHttpServer();

  // Start SMTP server for receiving emails directly
  await startSmtpServer();

  // Start subscriptions for processing outbound emails
  await startSubscriptions();
}

// Entrypoint
main().catch(error => {
  console.error('Failed to start servers:', error);
  process.exit(1);
});
