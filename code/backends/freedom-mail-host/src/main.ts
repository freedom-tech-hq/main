import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { makeTrace } from 'freedom-contexts';

import { startSmtpServer } from './modules/smtp-server/utils/startSmtpServer.ts';
import { startSubscriptions } from './modules/syncable-store/utils/startSubscriptions.ts';

const main = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace): PR<undefined> => {
    // Start SMTP server for receiving emails directly
    await startSmtpServer(trace);

    // Start subscriptions for processing outbound emails
    await startSubscriptions(trace);

    return makeSuccess(undefined);
  },
  {
    onFailure: (error) => {
      console.error('Failed to start servers:', error.cause ?? error);
      process.exit(1);
    }
  }
);

// Entrypoint
main(makeTrace('freedom-mail-host'));
