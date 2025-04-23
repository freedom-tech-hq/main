import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Trace } from 'freedom-contexts';

import * as config from '../../../config.ts';
import { assembleSmtpServer } from './assembleSmtpServer.ts';

/**
 * Start the SMTP server on all configured ports
 *
 * @param trace - Trace for async operations
 * @returns PR resolving to void on success
 */
export const startSmtpServer = makeAsyncResultFunc([import.meta.filename], async (trace: Trace): PR<undefined> => {
  // Start a server for each port
  for (const port of config.SMTP_PORTS) {
    // Port 25 is for inbound
    const secureOnly = port !== 25;

    // Create an instance
    const serverResult = await assembleSmtpServer(trace, secureOnly);
    if (!serverResult.ok) {
      return serverResult;
    }
    const server = serverResult.value;

    // Start listening on this port
    await new Promise<void>((resolve, reject) => {
      // Track the initialization errors
      const errorHandler = (err: Error) => {
        reject(err);
      };
      server.on('error', errorHandler);

      // Start
      server.listen(port, config.SMTP_HOST, () => {
        // Announce
        console.info(`SMTP Server (${secureOnly ? 'TLS only' : 'plain+TLS'}) listening on ${config.SMTP_HOST}:${port}`);

        // Clean up the promise
        server.off('error', errorHandler);
        resolve();
      });
    });
  }

  return makeSuccess(undefined);
});
