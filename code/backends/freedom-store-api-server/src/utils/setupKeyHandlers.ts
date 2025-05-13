import readline from 'node:readline';

import type { PR } from 'freedom-async';
import { bestEffort, inline, makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { getUserById } from 'freedom-db';
import { getEmailAgentSyncableStoreForUser } from 'freedom-email-server';
import type { EmailUserId } from 'freedom-email-sync';
import { logLs } from 'freedom-syncable-store';

import { addDemoEmail } from './addDemoEmail.ts';

type KeyPressHandler = (
  _chunk: any,
  key: { sequence?: string; name?: string; ctrl?: boolean; meta?: boolean; shift?: boolean } | undefined
) => void;
let globalLastKeyPressHandler: KeyPressHandler | undefined;

export const setupKeyHandlers = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { userId }: { userId: EmailUserId }): PR<undefined> => {
    readline.emitKeypressEvents(process.stdin);

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }

    console.log('Keyboard Shortcuts Enabled:');
    console.log('===========================');
    console.log('l – Log User FS (ls)');
    console.log('n – Add a new demo email');
    console.log('q – Quit');

    if (globalLastKeyPressHandler !== undefined) {
      process.stdin.off('keypress', globalLastKeyPressHandler);
      globalLastKeyPressHandler = undefined;
    }

    const keyPressHandler: KeyPressHandler = (_chunk, key) => {
      switch (key?.name ?? '') {
        case 'l':
          console.log('Got list command');
          inline(async () => await bestEffort(trace, logUserFsLs(trace, { userId })));
          break;
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
    };
    globalLastKeyPressHandler = keyPressHandler;
    process.stdin.on('keypress', keyPressHandler);

    return makeSuccess(undefined);
  }
);

// Helpers

const logUserFsLs = makeAsyncResultFunc(
  [import.meta.filename, 'logUserFsLs'],
  async (trace, { userId }: { userId: EmailUserId }): PR<undefined> => {
    const user = await uncheckedResult(getUserById(trace, userId));

    const syncableStore = await uncheckedResult(getEmailAgentSyncableStoreForUser(trace, user));
    await logLs(trace, syncableStore, console.log, { prefix: 'user fs: ' });
    return makeSuccess(undefined);
  }
);
