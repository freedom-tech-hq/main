import { makeAsyncFunc } from 'freedom-async';
import { buildMode, makeTrace } from 'freedom-contexts';

import { startHttpRestServer } from './startHttpRestServer.ts';
import { startHttpsRestServer } from './startHttpsRestServer.ts';

let expectedBuildMode = 'PROD' as 'DEV' | 'PROD';
DEV: expectedBuildMode = 'DEV';
if (expectedBuildMode !== buildMode) {
  throw new Error(`Build mode mismatch: ${buildMode} !== ${expectedBuildMode}`);
}

const main = makeAsyncFunc([import.meta.filename], async (trace) => {
  const keyPath = process.env.HTTPS_SERVER_KEY_PATH;
  const certPath = process.env.HTTPS_SERVER_CERT_PATH;
  const shouldUseHttps = keyPath !== undefined && certPath !== undefined;

  return shouldUseHttps ? await startHttpsRestServer(trace) : await startHttpRestServer(trace);
});

// Entrypoint
main(makeTrace());
