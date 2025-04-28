/**
 * Reference module exports
 */
import { buildMode } from 'freedom-contexts';

export * from './types/exports.ts';
export * from './utils/exports.ts';

let expectedBuildMode = 'PROD' as 'DEV' | 'PROD';
DEV: expectedBuildMode = 'DEV';
if (expectedBuildMode !== buildMode) {
  throw new Error(`Build mode mismatch: ${buildMode} !== ${expectedBuildMode}`);
}
