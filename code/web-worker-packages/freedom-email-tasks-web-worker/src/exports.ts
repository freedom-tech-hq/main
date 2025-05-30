import { buildMode, setLogger, wrapLogger } from 'freedom-contexts';

export * from './tasks/exports.ts';
export * from './types/exports.ts';

let expectedBuildMode = 'PROD' as 'DEV' | 'PROD';
DEV: expectedBuildMode = 'DEV';
if (expectedBuildMode !== buildMode) {
  throw new Error(`Build mode mismatch: ${buildMode} !== ${expectedBuildMode}`);
}

setLogger(wrapLogger(console));
