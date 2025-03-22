import fastify from 'fastify';
import { processEmail } from '../../email-encoder/utils/processEmail.ts';

// Define FastifyInstance type locally
type FastifyInstance = ReturnType<typeof fastify>;

/**
 * Create and configure the Fastify server
 */
export function assembleServer(): FastifyInstance {
  const server = fastify({ logger: true });

  // Define routes
  // TODO: Design our stable architecture for web server. Define actions (or routes?) in separate files
  //       Idea: ask AI to make a PoC Nest.js copy of this module and evaluate it to our standards. Ask to add
  //       input/output schemas, if missing.
  server.post('/incoming', async (request: any, reply: any) => {
    const emailData = request.body;

    if (!emailData || typeof emailData !== 'string' || emailData.length === 0) {
      return reply.code(400).send({
        success: false,
        error: 'Invalid email data. Expected raw email content as string.'
      });
    }

    await processEmail(emailData);

    return {};
  });

  return server;
}
