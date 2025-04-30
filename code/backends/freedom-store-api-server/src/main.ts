import { type PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { buildMode, log, makeTrace, setLogger, wrapLogger } from 'freedom-contexts';

import * as config from './config.ts';
import { initApp } from './initApp.ts';
import { startHttpRestServer } from './startHttpRestServer.ts';
import { startHttpsRestServer } from './startHttpsRestServer.ts';

let expectedBuildMode = 'PROD' as 'DEV' | 'PROD';
DEV: expectedBuildMode = 'DEV';
if (expectedBuildMode !== buildMode) {
  throw new Error(`Build mode mismatch: ${buildMode} !== ${expectedBuildMode}`);
}

const main = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace): PR<undefined> => {
    // Setup
    setLogger(wrapLogger(console, 'pretty-print'));
    await uncheckedResult(initApp(trace));

    // Start the HTTP REST server
    const shouldUseHttps = config.HTTPS_SERVER_KEY !== undefined && config.HTTPS_SERVER_CERT !== undefined;
    if (shouldUseHttps) {
      await uncheckedResult(startHttpsRestServer(trace));
    } else {
      await uncheckedResult(startHttpRestServer(trace));
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
