import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { buildMode, log, makeTrace, setLogger, wrapLogger } from 'freedom-contexts';

import { initApp } from './initApp.ts';
import { startSmtpServer } from './modules/smtp-server/utils/startSmtpServer.ts';
import { startSubscriptions } from './modules/syncable-store/utils/startSubscriptions.ts';

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

    // Start SMTP server for receiving emails directly
    await uncheckedResult(startSmtpServer(trace));

    // Start subscriptions for processing outbound emails
    await uncheckedResult(startSubscriptions(trace));

    return makeSuccess(undefined);
  },
  {
    onFailure: (error) => {
      log().error?.('Failed to start servers:', error.cause ?? error);
      process.exit(1);
    }
  }
);

// Entrypoint
main(makeTrace());
