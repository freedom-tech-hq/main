import { schema } from 'yaschema';

import { inSyncBundleSchema } from './InSyncBundle.ts';
import { inSyncFileSchema } from './InSyncFile.ts';
import { inSyncFolderSchema } from './InSyncFolder.ts';
import { outOfSyncBundleSchema } from './OutOfSyncBundle.ts';
import { outOfSyncFileSchema } from './OutOfSyncFile.ts';
import { outOfSyncFolderSchema } from './OutOfSyncFolder.ts';

export const syncPullResponseSchema = schema.oneOf(
  schema.oneOf3(inSyncFolderSchema, inSyncFileSchema, inSyncBundleSchema),
  schema.oneOf3(outOfSyncFolderSchema, outOfSyncFileSchema, outOfSyncBundleSchema)
);
export type SyncPullResponse = typeof syncPullResponseSchema.valueType;
