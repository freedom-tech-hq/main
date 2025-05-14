import type { SyncGlob } from 'freedom-sync-types';
import { SyncablePathPattern } from 'freedom-sync-types';

import type { SyncStrategy } from '../../types/SyncStrategy.ts';

export const getGlobForStrategy = (strategy: SyncStrategy): SyncGlob => {
  switch (strategy) {
    case 'item':
      return { include: [new SyncablePathPattern()] };
    case 'level':
      return { include: [new SyncablePathPattern(), new SyncablePathPattern('*')] };
    case 'stack':
      return { include: [new SyncablePathPattern('**')] };
  }
};
