import type { TestContext } from 'node:test';

import { type ChainableResult, resolveChain } from 'freedom-async';
import type { SyncServiceLogEntry } from 'freedom-sync-service';
import type { SyncableItemType, SyncablePath } from 'freedom-sync-types';
import { expectOk } from 'freedom-testing-tools';

export const expectDidPullPath = async (
  t: TestContext,
  logEntries: SyncServiceLogEntry[],
  chainablePath: ChainableResult<SyncablePath, any>,
  expectedType: SyncableItemType
) => {
  const path = await resolveChain(chainablePath);
  expectOk(path);

  const pathString = path.value.toString();
  t.assert.notStrictEqual(
    logEntries.find((entry) => entry.type === 'pull' && entry.itemType === expectedType && entry.pathString === pathString),
    undefined,
    `Should have pulled ${expectedType} ${path.value.toString()}`
  );
};
