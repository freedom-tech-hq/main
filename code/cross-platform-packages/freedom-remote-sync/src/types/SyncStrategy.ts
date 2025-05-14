import { makeStringSubtypeArray } from 'yaschema';

/**
 * item - a single item
 * level - an item and its first level children if applicable
 * stack - an item and all its descendants
 */
export const syncStrategies = makeStringSubtypeArray('item', 'level', 'stack');
export type SyncStrategy = (typeof syncStrategies)[0];
