import { makeIdInfo } from 'freedom-basic-data';
import { schema } from 'yaschema';

import { syncableIdSchema } from '../SyncableId.ts';

export const syncableEncryptedItemNameInfo = makeIdInfo('E_');
export type SyncableEncryptedItemName = typeof syncableEncryptedItemNameInfo.schema.valueType;

export const syncableItemNameSchema = schema.oneOf(syncableIdSchema, syncableEncryptedItemNameInfo.schema);
export type SyncableItemName = typeof syncableItemNameSchema.valueType;
