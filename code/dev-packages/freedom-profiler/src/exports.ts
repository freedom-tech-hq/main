import { buildMode } from 'freedom-contexts';

export * from './debugProfiler.ts';

let expectedBuildMode = 'PROD' as 'DEV' | 'PROD';
DEV: expectedBuildMode = 'DEV';
if (expectedBuildMode !== buildMode) {
  throw new Error(`Build mode mismatch: ${buildMode} !== ${expectedBuildMode}`);
}
