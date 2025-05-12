import type { TestContext } from 'node:test';

import { type ChainableResult, resolveChain } from 'freedom-async';
import { extractSyncableItemTypeFromPath, type SyncableItemType, type SyncablePath } from 'freedom-sync-types';
import { expectOk } from 'freedom-testing-tools';

import type { RemoteSyncLogEntry } from '../types/RemoteSyncLogEntry.ts';

export const expectDidPullPath = async (
  t: TestContext,
  logEntries: RemoteSyncLogEntry[],
  chainablePath: ChainableResult<SyncablePath, any>,
  expectedType: SyncableItemType
) => {
  const path = await resolveChain(chainablePath);
  expectOk(path);

  t.assert.notStrictEqual(
    logEntries.find(
      (entry) => entry.type === 'pull' && extractSyncableItemTypeFromPath(entry.path) === expectedType && entry.path.isEqual(path.value)
    ),
    undefined,
    `Should have pulled ${expectedType} ${path.value.toString()}`
  );
};
