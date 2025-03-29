import type { Uuid } from 'freedom-basic-data';
import { Cast } from 'freedom-cast';
import { uuidId } from 'freedom-sync-types';

/** This is only used as an internal marker */
export const ROOT_FOLDER_ID = uuidId('folder', Cast<Uuid>('00000000-0000-0000-0000-000000000000'));
