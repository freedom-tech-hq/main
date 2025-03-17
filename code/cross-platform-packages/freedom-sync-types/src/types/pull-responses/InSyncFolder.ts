import type { Sha256Hash } from 'freedom-basic-data';

export interface InSyncFolder {
  type: 'folder';
  outOfSync: false;
  accessControlHash?: Sha256Hash;
  hashesById?: undefined;
}
