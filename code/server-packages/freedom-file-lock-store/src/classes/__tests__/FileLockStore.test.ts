import os from 'node:os';
import path from 'node:path';

import { makeTestsForLockStore } from 'freedom-locking-types/tests';
import { promises as fs } from 'fs';

import { FileLockStore } from '../FileLockStore.ts';

makeTestsForLockStore(
  'FileLockStore',

  async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lockstore-test-'));
    return [new FileLockStore<string>(tempDir), async () => await fs.rm(tempDir, { recursive: true, force: true })];
  }
);
