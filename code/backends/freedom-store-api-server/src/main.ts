import { log, type PR, setLogger } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { makeTrace, wrapLogger } from 'freedom-contexts';
import { startHttpRestServer, startHttpsRestServer } from 'freedom-fake-email-service';

const main = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace): PR<undefined> => {
    setLogger(wrapLogger(console));

    const keyPath = process.env.HTTPS_SERVER_KEY_PATH;
    const certPath = process.env.HTTPS_SERVER_CERT_PATH;
    const shouldUseHttps = keyPath !== undefined && certPath !== undefined;

    // Start the HTTP REST server
    if (shouldUseHttps) {
      await startHttpsRestServer(trace);
    } else {
      await startHttpRestServer(trace);
    }

    return makeSuccess(undefined);
  },
  {
    onFailure: (error) => {
      log().error?.('Failed to start server:', error.cause ?? error);
      process.exit(1);
    }
  }
);

// Entrypoint
main(makeTrace());
