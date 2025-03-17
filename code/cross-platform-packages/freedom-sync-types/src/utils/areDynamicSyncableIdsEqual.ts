import { isEqual } from 'lodash-es';

import type { DynamicSyncableId } from '../types/DynamicSyncableId.ts';

export const areDynamicSyncableIdsEqual = (a: DynamicSyncableId, b: DynamicSyncableId) => isEqual(a, b);
