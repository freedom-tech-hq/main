import type { TestContext } from 'node:test';

import type { ChainableResult } from 'freedom-async';
import { resolveChain } from 'freedom-async';
import type { SyncServiceLogEntry } from 'freedom-sync-service';
import type { StaticSyncablePath } from 'freedom-sync-types';
import { expectOk } from 'freedom-testing-tools';

export const expectWasNotifiedAboutPath = async (
  t: TestContext,
  logEntries: SyncServiceLogEntry[],
  chainablePath: ChainableResult<StaticSyncablePath, any>
) => {
  const path = await resolveChain(chainablePath);
  expectOk(path);

  const pathString = path.value.toString();
  t.assert.notStrictEqual(
    logEntries.find((entry) => entry.type === 'notified' && entry.pathString === pathString),
    undefined,
    `Should have been notified about ${path.value.toString()}`
  );
};
