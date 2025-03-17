import { plainId } from 'freedom-sync-types';

export const ACCESS_CONTROL_BUNDLE_FILE_ID = plainId('access-control');
export const STORE_CHANGES_BUNDLE_FILE_ID = plainId('changes');

export const SNAPSHOTS_BUNDLE_FILE_ID = plainId('snapshots');

export const makeDeltasBundleFileId = (snapshotId: string) => plainId(`${snapshotId}-deltas`);
