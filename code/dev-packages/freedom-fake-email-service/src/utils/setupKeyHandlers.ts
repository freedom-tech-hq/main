import readline from 'node:readline';

import type { PR } from 'freedom-async';
import { bestEffort, inline, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { EmailUserId } from 'freedom-email-sync';

import { addDemoEmail } from './addDemoEmail.ts';

export const setupKeyHandlers = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { userId }: { userId: EmailUserId }): PR<undefined> => {
    readline.emitKeypressEvents(process.stdin);

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }

    console.log('Keyboard Shortcuts Enabled:');
    console.log('===========================');
    console.log('n – Add a new demo email');
    console.log('q – Quit');

    process.stdin.on(
      'keypress',
      (_chunk, key: { sequence?: string; name?: string; ctrl?: boolean; meta?: boolean; shift?: boolean } | undefined) => {
        switch (key?.name ?? '') {
          case 'n':
            console.log('Got new demo email command');
            inline(async () => await bestEffort(trace, addDemoEmail(trace, { userId })));
            break;
          case 'c':
            if (key?.ctrl ?? false) {
              console.log('Got quit command');
              process.kill(process.pid, 'SIGINT');
            }
            break;
          case 'q':
            console.log('Got quit command');
            process.kill(process.pid, 'SIGINT');
            break;
        }
      }
    );

    return makeSuccess(undefined);
  }
);
