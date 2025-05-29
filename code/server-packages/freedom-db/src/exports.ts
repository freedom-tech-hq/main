import { buildMode } from 'freedom-contexts';

export * from './config.ts';
export * from './db/postgresClient.ts';
export * from './model/exports.ts';

let expectedBuildMode = 'PROD' as 'DEV' | 'PROD';
DEV: expectedBuildMode = 'DEV';
if (expectedBuildMode !== buildMode) {
  throw new Error(`Build mode mismatch: ${buildMode} !== ${expectedBuildMode}`);
}
