import { buildMode } from 'freedom-contexts';

export * from './defaultServiceContext.ts';
export * from './getOrCreateServiceContext.ts';
export * from './ServiceContext.ts';
export * from './trace-service-context.ts';

let expectedBuildMode = 'PROD' as 'DEV' | 'PROD';
DEV: expectedBuildMode = 'DEV';
if (expectedBuildMode !== buildMode) {
  throw new Error(`Build mode mismatch: ${buildMode} !== ${expectedBuildMode}`);
}
