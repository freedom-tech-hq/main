import { buildMode } from 'freedom-contexts';

export * as api from './api/exports.ts';
export * as clientApi from './clientApi/exports.ts';
export * as types from './types/exports.ts';

let expectedBuildMode = 'PROD' as 'DEV' | 'PROD';
DEV: expectedBuildMode = 'DEV';
if (expectedBuildMode !== buildMode) {
  throw new Error(`Build mode mismatch: ${buildMode} !== ${expectedBuildMode}`);
}
