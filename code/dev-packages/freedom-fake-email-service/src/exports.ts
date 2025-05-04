import { buildMode } from 'freedom-contexts';

// export * from './startHttpRestServer.ts';
// export * from './startHttpsRestServer.ts';
export * from './utils/getFsRootPathForStorageRootId.ts';
// inlined in freedom-syncable-store-server: export * from './utils/getSyncableStoreBackingForUserEmail.ts';

let expectedBuildMode = 'PROD' as 'DEV' | 'PROD';
DEV: expectedBuildMode = 'DEV';
if (expectedBuildMode !== buildMode) {
  throw new Error(`Build mode mismatch: ${buildMode} !== ${expectedBuildMode}`);
}
