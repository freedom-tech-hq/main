import type { SyncableItemType } from 'freedom-sync-types';
import type { SingleOrArray } from 'yaschema';

export const intersectSyncableItemTypes = <T1 extends SyncableItemType, T2 extends SyncableItemType>(
  a: SingleOrArray<T1> | undefined,
  b: SingleOrArray<T2>
): SingleOrArray<T1 & T2> => {
  if (a === undefined) {
    return b as Array<T1 & T2>;
  }

  const aSet = new Set<any>(Array.isArray(a) ? a : [a]);
  const bSet = new Set<any>(Array.isArray(b) ? b : [b]);
  return Array.from(aSet).filter((type) => bSet.has(type)) as Array<T1 & T2>;
};
