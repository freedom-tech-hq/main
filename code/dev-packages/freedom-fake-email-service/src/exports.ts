import { buildMode } from 'freedom-contexts';

export * from './startHttpRestServer.ts';
export * from './startHttpsRestServer.ts';
export type { OutboundEmailHandlerArgs } from './types/OutboundEmailHandlerArgs.ts';
export * from './utils/addIncomingEmail.ts';
export { subscribeOnOutboundEmails } from './utils/subscribeOnOutboundEmails.ts';

let expectedBuildMode = 'PROD' as 'DEV' | 'PROD';
DEV: expectedBuildMode = 'DEV';
if (expectedBuildMode !== buildMode) {
  throw new Error(`Build mode mismatch: ${buildMode} !== ${expectedBuildMode}`);
}
