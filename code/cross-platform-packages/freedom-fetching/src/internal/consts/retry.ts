import { ONE_MIN_MSEC, ONE_SEC_MSEC } from 'freedom-basic-data';

export const MAX_RETRY_DATA_UPLOAD_ACCUMULATED_DELAY_MSEC = 10 * ONE_MIN_MSEC;

export const dataUploadExponentialBackoffTimeMSec: number[] = [
  ONE_SEC_MSEC,
  2 * ONE_SEC_MSEC,
  4 * ONE_SEC_MSEC,
  8 * ONE_SEC_MSEC,
  16 * ONE_SEC_MSEC,
  32 * ONE_SEC_MSEC
];
