import type { SyncableItemType } from 'freedom-sync-types';
import type { SingleOrArray } from 'yaschema';

export const intersectSyncableItemTypes = <T1 extends SyncableItemType, T2 extends SyncableItemType>(
  a: SingleOrArray<T1> | undefined,
  b: SingleOrArray<T2>
): SingleOrArray<T1 & T2> => {
  if (a === undefined) {
    return b as SingleOrArray<T1 & T2>;
  }

  const aArray = Array.isArray(a) ? a : [a];
  const bSet = new Set<any>(Array.isArray(b) ? b : [b]);
  return aArray.filter((type) => bSet.has(type)) as Array<T1 & T2>;
};
