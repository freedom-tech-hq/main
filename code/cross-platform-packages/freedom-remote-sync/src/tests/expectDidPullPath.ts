import assert from 'node:assert';

import { type ChainableResult, resolveChain } from 'freedom-async';
import { extractSyncableItemTypeFromPath, type SyncablePath } from 'freedom-sync-types';
import { expectOk } from 'freedom-testing-tools';

import type { RemoteSyncLogEntry } from '../types/RemoteSyncLogEntry.ts';

export const expectDidPullPath = async (logEntries: RemoteSyncLogEntry[], chainablePath: ChainableResult<SyncablePath, any>) => {
  const path = await resolveChain(chainablePath);
  expectOk(path);

  assert.notStrictEqual(
    logEntries.find((entry) => entry.type === 'pull' && entry.path.isEqual(path.value)),
    undefined,
    `Should have pulled ${extractSyncableItemTypeFromPath(path.value)} ${path.value.toString()}`
  );
};
