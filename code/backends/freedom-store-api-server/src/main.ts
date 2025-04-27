import { log, type PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { makeTrace } from 'freedom-contexts';
import { startHttpRestServer, startHttpsRestServer } from 'freedom-fake-email-service';
import express from 'express';
import cors from 'cors';
import credentialsRoutes from './routes/credentials.ts';

const setupServer = () => {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  
  // Routes
  app.use('/api/credentials', credentialsRoutes);
  
  return app;
};

const main = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace): PR<undefined> => {
    const keyPath = process.env.HTTPS_SERVER_KEY_PATH;
    const certPath = process.env.HTTPS_SERVER_CERT_PATH;
    const shouldUseHttps = keyPath !== undefined && certPath !== undefined;

    // Create Express app
    const app = setupServer();
    const PORT = process.env.PORT || 3001;
    
    // Start the server
    app.listen(PORT, () => {
      log().info?.(`Credential API server running on port ${PORT}`);
    });
    
    // Start the HTTP REST server for email
    if (shouldUseHttps) {
      await startHttpsRestServer(trace);
    } else {
      await startHttpRestServer(trace);
    }

    return makeSuccess(undefined);
  },
  {
    onFailure: (error) => {
      log().error?.('Failed to start server:', error.cause ?? error);
      process.exit(1);
    }
  }
);

// Entrypoint
main(makeTrace('freedom-store-api-server'));
