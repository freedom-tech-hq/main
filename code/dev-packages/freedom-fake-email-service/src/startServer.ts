import 'dotenv/config';

import type http from 'node:http';

import { shutdownWsHandlers } from 'express-yaschema-ws-api-handler';
import { callAsyncFunc, log, makeAsyncFunc } from 'freedom-async';
import { makeSubTrace } from 'freedom-contexts';
import { hasMoreToDoSoon, waitForDoSoons } from 'freedom-do-soon';
import { defaultServiceContext } from 'freedom-trace-service-context';
import { once } from 'lodash-es';

import { createServerPrivateKeysIfNeeded } from './utils/createServerPrivateKeysIfNeeded.ts';

export const startServer = makeAsyncFunc(
  [import.meta.filename],
  async (trace, server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>) => {
    const PORT = Number(process.env.PORT);

    // eslint-disable-next-line no-async-promise-executor
    return await new Promise<() => Promise<void>>(async (resolveServerStartUp, rejectServerStartUp) => {
      try {
        const createdPrivateKeys = await createServerPrivateKeysIfNeeded(trace);
        if (!createdPrivateKeys.ok) {
          rejectServerStartUp(createdPrivateKeys.value);
          return;
        }

        const startedServer = server.listen(PORT, () => {
          log().info?.(trace, `Server now listening on port ${PORT}`);

          const shutDown = once(async () => {
            log().info?.(trace, 'SIGTERM - stopping server');

            const shutdownWsHandlersPromise = shutdownWsHandlers();

            return await new Promise<void>((resolveServerShutDown) => {
              startedServer.close(() =>
                callAsyncFunc(makeSubTrace(trace, ['shutDown']), {}, async (trace) => {
                  log().info?.(trace, 'Incoming HTTP connections are no longer being accepted');

                  await shutdownWsHandlersPromise;
                  log().info?.(trace, 'WebSocket handlers are stopped');

                  do {
                    log().info?.(trace, 'Waiting for async work to wrap up');
                    await waitForDoSoons({ shutdown: true, serviceContext: defaultServiceContext });
                  } while (hasMoreToDoSoon({ serviceContext: defaultServiceContext }));
                  log().info?.(trace, 'All async work is complete');

                  resolveServerShutDown();
                })
              );
            });
          });

          const shutdownThenExitProcess = once(async () => {
            await shutDown();
            process.exit(0);
          });
          process.on('SIGINT', shutdownThenExitProcess);
          process.on('SIGTERM', shutdownThenExitProcess);

          resolveServerStartUp(shutDown);
        });
      } catch (e) {
        log().error?.(trace, `Error starting server`, e);
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        rejectServerStartUp(e);
      }
    });
  }
);
