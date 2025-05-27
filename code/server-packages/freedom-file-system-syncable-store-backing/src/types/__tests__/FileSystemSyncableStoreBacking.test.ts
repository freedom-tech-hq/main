import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { makeUuid } from 'freedom-contexts';
import { makeTestsForSyncableStoreBacking } from 'freedom-syncable-store/tests';
import { expectOk } from 'freedom-testing-tools';

import { FileSystemSyncableStoreBacking } from '../FileSystemSyncableStoreBacking.ts';

makeTestsForSyncableStoreBacking('FileSystemSyncableStoreBacking', async (trace, { metadata }) => {
  const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), `fs-sync-store-${makeUuid().slice(0, 8)}-`));
  console.log('rootPath', rootPath);
  const storeBacking = new FileSystemSyncableStoreBacking(rootPath);
  expectOk(await storeBacking.initialize(trace, { provenance: metadata.provenance }));

  const teardown = async (): Promise<void> => {
    await fs.rm(rootPath, { recursive: true, force: true });
  };

  return [storeBacking, teardown];
});
