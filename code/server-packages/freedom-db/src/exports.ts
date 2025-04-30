import { buildMode } from 'freedom-contexts';

export * from './config.ts';
export * from './model/exports.ts';

// TMP
export * from './model/internal/utils/getPrivateKeyStore.ts';
export * from './model/internal/utils/getPublicKeyStore.ts';

let expectedBuildMode = 'PROD' as 'DEV' | 'PROD';
DEV: expectedBuildMode = 'DEV';
if (expectedBuildMode !== buildMode) {
  throw new Error(`Build mode mismatch: ${buildMode} !== ${expectedBuildMode}`);
}
