import { schema } from 'yaschema';

import type { OutOfSyncBundle } from './OutOfSyncBundle.ts';
import { outOfSyncBundleSchema } from './OutOfSyncBundle.ts';
import type { OutOfSyncFile } from './OutOfSyncFile.ts';
import { outOfSyncFileSchema } from './OutOfSyncFile.ts';
import type { OutOfSyncFolder } from './OutOfSyncFolder.ts';
import { outOfSyncFolderSchema } from './OutOfSyncFolder.ts';

export const outOfSyncResponseSchema = schema.oneOf3(outOfSyncFolderSchema, outOfSyncFileSchema, outOfSyncBundleSchema);
export type OutOfSyncResponse = OutOfSyncFolder | OutOfSyncFile | OutOfSyncBundle;
