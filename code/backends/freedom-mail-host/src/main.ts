import { startSmtpServer } from './modules/smtp-server/utils/startSmtpServer.ts';

async function main() {
  // Start HTTP server for API endpoints
  // await startHttpServer();

  // Start SMTP server for receiving emails directly
  await startSmtpServer();
}

// Entrypoint
main().catch(error => {
  console.error('Failed to start servers:', error);
  process.exit(1);
});
