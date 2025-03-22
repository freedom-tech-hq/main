import { Storage } from '@google-cloud/storage';
import * as config from '../../../../config.ts';

// Initialize Google Cloud Storage
const storage = new Storage({
  credentials: config.GOOGLE_APPLICATION_CREDENTIALS_RAW,
});
const bucket = storage.bucket(config.APP_BUCKET);

/**
 * Get a reference to the Google Cloud Storage bucket
 */
export function getBucket() {
  return bucket;
}
