import assert from 'node:assert';

import type { ChainableResult } from 'freedom-async';
import { resolveChain } from 'freedom-async';
import type { SyncablePath } from 'freedom-sync-types';
import { expectOk } from 'freedom-testing-tools';

import type { RemoteSyncLogEntry } from '../types/RemoteSyncLogEntry.ts';

export const expectWasNotifiedAboutPath = async (logEntries: RemoteSyncLogEntry[], chainablePath: ChainableResult<SyncablePath, any>) => {
  const path = await resolveChain(chainablePath);
  expectOk(path);

  assert.notStrictEqual(
    logEntries.find((entry) => entry.type === 'notified' && entry.path.isEqual(path.value)),
    undefined,
    `Should have been notified about ${path.value.toString()}`
  );
};
