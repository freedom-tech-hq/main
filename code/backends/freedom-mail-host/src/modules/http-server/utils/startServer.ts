import * as config from '../../../config.ts';
import { assembleServer } from './assembleServer.ts';

/**
 * Start the server
 */
export async function startServer(): Promise<void> {
  const server = assembleServer();

  try {
    await server.listen({ port: config.PORT, host: config.HOST });
    // TODO: Configure log provider
    server.log.info(`Server listening on ${config.HOST}:${config.PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}
