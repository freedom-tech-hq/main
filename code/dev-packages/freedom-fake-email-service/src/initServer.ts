import { uncheckedResult } from 'freedom-async';
import { makeTrace } from 'freedom-contexts';
import { initConfig as dbInitConfig } from 'freedom-db';

import { getAllStorageRootPath } from './utils/getAllStorageRootPath.ts';

export async function initServer() {
  // TODO: Normalize config
  const trace = makeTrace();
  const allStorageRootPath = await uncheckedResult(getAllStorageRootPath(trace));
  dbInitConfig({
    allStorageRootPath
  });
}
