import * as config from '../../../config.ts';
import { assembleSmtpServer } from './assembleSmtpServer.ts';

/**
 * Start the SMTP server on all configured ports
 */
export async function startSmtpServer(): Promise<void> {
  // Start a server for each port
  for (const port of config.SMTP_PORTS) {
    // Port 25 is for inbound
    const secureOnly = port !== 25;

    // Create an instance
    const server = assembleSmtpServer(secureOnly);

    // Start listening on this port
    await new Promise<void>((resolve, reject) => {
      try {
        server.listen(port, config.SMTP_HOST, () => {
          console.info(`SMTP Server (${secureOnly ? 'TLS only' : 'plain+TLS'}) listening on ${config.SMTP_HOST}:${port}`);
          resolve();
        });
      } catch (err) {
        reject(err);
      }
    });
  }
}
