import fs from 'node:fs';

import { Storage } from '@google-cloud/storage';
import { DateTime } from 'luxon';
import { type IBucket, MockStorage } from 'mock-gcs';

// This is a real shared bucket
const SHARED_DEV_BUCKET_NAME = 'test-bucket-ihlxwyts';

let isRealConnectionEnabled = false;
let bucket: IBucket | undefined;

function enableRealConnection() {
  isRealConnectionEnabled = true;
}

export const createGoogleStorageBucketForTests = Object.assign(
  function (): { bucket: IBucket; prefix: string } {
    // Use a real shared bucket
    if (isRealConnectionEnabled) {
      // Same buket for all cases
      if (bucket === undefined) {
        const storage = new Storage({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          credentials: JSON.parse(fs.readFileSync(import.meta.dirname + '/../../../../gcp-serviceAccountKey.json', 'utf8'))
        });

        bucket = storage.bucket(SHARED_DEV_BUCKET_NAME);
      }

      return {
        bucket,
        // Separate cases with a prefix
        prefix: `test_${DateTime.now().toFormat('yyyyLLdd-HHmmss.SSS')}/`
      };
    }

    // Reset mock every time, no prefix
    const storage = new MockStorage();
    return {
      bucket: storage.bucket(SHARED_DEV_BUCKET_NAME),
      prefix: ''
    };
  },
  {
    enableRealConnection
  }
);
