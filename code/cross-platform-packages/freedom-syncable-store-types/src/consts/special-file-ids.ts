import { plainId } from 'freedom-sync-types';

export const ACCESS_CONTROL_BUNDLE_ID = plainId({ encrypted: false, type: 'bundle' }, 'access-control');
export const STORE_CHANGES_BUNDLE_ID = plainId({ encrypted: false, type: 'bundle' }, 'changes');

export const SNAPSHOTS_BUNDLE_ID = ({ encrypted }: { encrypted: boolean }) => plainId({ encrypted, type: 'bundle' }, 'snapshots');

export const makeDeltasBundleId = ({ encrypted }: { encrypted: boolean }, snapshotId: string) =>
  plainId({ encrypted, type: 'bundle' }, `${snapshotId}-deltas`);
