import { makeStringSubtypeArray } from 'yaschema';

export const syncStrategies = makeStringSubtypeArray('default', 'batch');
export type SyncStrategy = (typeof syncStrategies)[number];
