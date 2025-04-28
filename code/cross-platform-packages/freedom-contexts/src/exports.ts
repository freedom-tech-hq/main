import { setupDevLogger } from './config/logging.ts';

export * from './config/exports.ts';
export * from './consts/exports.ts';
export * from './trace-utils/exports.ts';
export * from './types/exports.ts';
export * from './utils/exports.ts';

export let buildMode = 'PROD' as 'DEV' | 'PROD';
DEV: {
  buildMode = 'DEV';
  setupDevLogger();
}
