import type { TestContext } from 'node:test';

import type { ChainableResult } from 'freedom-async';
import { resolveChain } from 'freedom-async';
import type { SyncServiceLogEntry } from 'freedom-sync-service';
import type { StaticSyncablePath, SyncableItemType } from 'freedom-sync-types';
import { expectOk } from 'freedom-testing-tools';

export const expectDidPushPath = async (
  t: TestContext,
  logEntries: SyncServiceLogEntry[],
  chainablePath: ChainableResult<StaticSyncablePath, any>,
  expectedType: SyncableItemType
) => {
  const path = await resolveChain(chainablePath);
  expectOk(path);

  const pathString = path.value.toString();
  t.assert.notStrictEqual(
    logEntries.find((entry) => entry.type === 'push' && entry.itemType === expectedType && entry.pathString === pathString),
    undefined,
    `Should have pushed ${expectedType} ${path.value.toString()}`
  );
};
