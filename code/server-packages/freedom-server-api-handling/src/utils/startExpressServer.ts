import type http from 'node:http';

import type { PR } from 'freedom-async';
import { callAsyncFunc, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { makeSubTrace } from 'freedom-contexts';
import { hasMoreToDoSoon, waitForDoSoons } from 'freedom-do-soon';
import type { ServiceContext } from 'freedom-trace-service-context';
import { once } from 'lodash-es';

import { log } from '../config/logging.ts';

export const startExpressServer = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>,
    { port, serviceContext, onShutdown }: { port: number; serviceContext: ServiceContext; onShutdown?: () => Promise<void> }
  ): PR<{ shutDown: () => Promise<void> }> => {
    // eslint-disable-next-line no-async-promise-executor
    return await new Promise(async (resolveServerStartUp, rejectServerStartUp) => {
      try {
        const startedServer = server.listen(port, () => {
          log().info?.(trace, `Server now listening on port ${port}`);

          const shutDown = once(async () => {
            log().info?.(trace, 'SIGTERM - stopping server');

            const onShutdownPromise = onShutdown?.();

            return await new Promise<void>((resolveServerShutDown) => {
              startedServer.close(() =>
                callAsyncFunc(makeSubTrace(trace, ['shutDown']), {}, async (trace) => {
                  log().info?.(trace, 'Incoming HTTP connections are no longer being accepted');

                  await onShutdownPromise;

                  do {
                    log().info?.(trace, 'Waiting for async work to wrap up');
                    await waitForDoSoons({ shutdown: true, serviceContext });
                  } while (hasMoreToDoSoon({ serviceContext }));
                  log().info?.(trace, 'All async work is complete');

                  resolveServerShutDown();
                })
              );
            });
          });

          resolveServerStartUp(makeSuccess({ shutDown }));
        });
      } catch (e) {
        log().error?.(trace, `Error starting server`, e);
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        rejectServerStartUp(e);
      }
    });
  }
);
