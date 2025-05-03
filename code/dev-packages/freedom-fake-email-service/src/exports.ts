import { buildMode } from 'freedom-contexts';

// export * from './startHttpRestServer.ts';
// export * from './startHttpsRestServer.ts';
export * from './utils/createSyncableStore.ts';
export * from './utils/getOrCreateEmailAccessForUser.ts';
export * from './utils/getOrCreateEmailAccessForUserPure.ts';

let expectedBuildMode = 'PROD' as 'DEV' | 'PROD';
DEV: expectedBuildMode = 'DEV';
if (expectedBuildMode !== buildMode) {
  throw new Error(`Build mode mismatch: ${buildMode} !== ${expectedBuildMode}`);
}
