/* node:coverage disable */

export * from './classes/exports.ts';
export * from './consts/exports.ts';
export * from './utils/exports.ts';

if (process.env['NODE_ENV'] !== 'test') {
  console.warn(`Running tests with NODE_ENV=${process.env['NODE_ENV']}. NODE_ENV=test is recommended for determinism.`);
}
