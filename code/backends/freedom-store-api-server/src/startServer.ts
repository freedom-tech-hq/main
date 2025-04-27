import 'dotenv/config';

import type http from 'node:http';

import { shutdownWsHandlers } from 'express-yaschema-ws-api-handler';
import type { PR } from 'freedom-async';
import { makeAsyncFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { doSoon, hasMoreToDoSoon, waitForDoSoons } from 'freedom-do-soon';
import { createServerPrivateKeysIfNeeded } from 'freedom-fake-email-service';
import { log, startExpressServer } from 'freedom-server-api-handling';
import { defaultServiceContext } from 'freedom-trace-service-context';
import { once } from 'lodash-es';

import * as config from './config.ts';

export const startServer = makeAsyncFunc(
  [import.meta.filename],
  async (
    trace,
    server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>,
    { port = config.PORT }: { port?: number } = {}
  ): PR<{ shutDown: () => Promise<void> }> => {
    await uncheckedResult(createServerPrivateKeysIfNeeded(trace));

    const expressServer = await startExpressServer(trace, server, {
      port,
      onShutdown: async () => {
        await shutdownWsHandlers();
        log().info?.(trace, 'WebSocket handlers are stopped');
      }
    });
    if (!expressServer.ok) {
      return expressServer;
    }

    const shutdownThenExitProcess = once(async () => {
      // Using the default service context in case there are multiple services running in the same node process.  Giving each a chance to
      // shutdown cleanly.
      doSoon(trace, async () => await expressServer.value.shutDown(), { serviceContext: defaultServiceContext });

      do {
        log().info?.(trace, `Waiting for async work to wrap up in service context: ${defaultServiceContext.id}`);
        await waitForDoSoons(trace, { shutdown: true, serviceContext: defaultServiceContext });
      } while (hasMoreToDoSoon(trace, { serviceContext: defaultServiceContext }));

      process.exit(0);
    });
    process.on('SIGINT', shutdownThenExitProcess);
    process.on('SIGTERM', shutdownThenExitProcess);

    return makeSuccess(expressServer.value);
  }
);
