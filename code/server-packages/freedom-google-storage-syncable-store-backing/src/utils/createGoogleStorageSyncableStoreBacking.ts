import { Storage } from '@google-cloud/storage';

import { GoogleStorageSyncableStoreBacking } from '../types/GoogleStorageSyncableStoreBacking.ts';

// Static function - pure constructor. Not wrapping with PR<>
export function createGoogleStorageSyncableStoreBacking({ credentials, bucketName }: { credentials: object; bucketName: string }) {
  // TODO: Make parallelism limited:
  //  new Storage({ ... clientOptions: { transporterOptions: { agent: new HttpsAgent({ maxSockets: N }) } } })
  //  check defaults - for Node.js it is infinite, but Goggle SDK might override it
  const storage = new Storage({
    credentials
  });

  const bucket = storage.bucket(bucketName);

  const backing = new GoogleStorageSyncableStoreBacking(bucket);

  return backing;
}
