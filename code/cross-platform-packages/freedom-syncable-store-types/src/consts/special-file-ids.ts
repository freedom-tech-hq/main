import { plainId } from 'freedom-sync-types';

export const ACCESS_CONTROL_BUNDLE_ID = plainId('access-control');
export const STORE_CHANGES_BUNDLE_ID = plainId('changes');

export const SNAPSHOTS_BUNDLE_ID = plainId('snapshots');

export const makeDeltasBundleId = (snapshotId: string) => plainId(`${snapshotId}-deltas`);
