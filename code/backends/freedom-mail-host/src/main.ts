/**
 * Main entry point for the freedom-mail-host module
 */

import { startServer } from './modules/http-server/utils/startServer.ts';

// Start the server
startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
