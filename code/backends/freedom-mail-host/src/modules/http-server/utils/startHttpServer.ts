import * as config from '../../../config.ts';
import { assembleHttpServer } from './assembleHttpServer.ts';

/**
 * Starts the server from assembleHttpServer()
 */
export async function startHttpServer(): Promise<void> {
  const server = assembleHttpServer();

  try {
    await server.listen({ port: config.HTTP_PORT, host: config.HTTP_HOST });
    // TODO: Configure log provider
    server.log.info(`HTTP Server listening on ${config.HTTP_HOST}:${config.HTTP_PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}
