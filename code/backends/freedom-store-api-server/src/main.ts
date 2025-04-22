import { makeTrace } from 'freedom-contexts';
import { startHttpRestServer, startHttpsRestServer } from 'freedom-fake-email-service';

async function main() {
  const trace = makeTrace();

  const keyPath = process.env.HTTPS_SERVER_KEY_PATH;
  const certPath = process.env.HTTPS_SERVER_CERT_PATH;
  const shouldUseHttps = keyPath !== undefined && certPath !== undefined;

  // Start the HTTP REST server
  return shouldUseHttps ? await startHttpsRestServer(trace) : await startHttpRestServer(trace);
}

// Entrypoint
main().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
