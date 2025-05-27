import { ZERO_UUID } from 'freedom-basic-data';
import { uuidId } from 'freedom-sync-types';

/** This is only used as an internal marker */
// TODO: Delete this from backing, it exists in freedom-syncable-store
export const ROOT_FOLDER_ID = uuidId('folder', ZERO_UUID);
