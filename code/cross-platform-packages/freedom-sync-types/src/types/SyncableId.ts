import type { Uuid } from 'freedom-basic-data';
import { makeIdInfo, uuidSchema } from 'freedom-basic-data';
import { schema } from 'yaschema';

export const syncablePlainIdInfo = makeIdInfo('._');
export type SyncablePlainId = typeof syncablePlainIdInfo.schema.valueType;
export const plainId = (plainId: string) => syncablePlainIdInfo.make(plainId);

export const syncableUuidSchema = uuidSchema;
export type SyncableUuidId = Uuid;

export const syncableIdSchema = schema.oneOf(syncablePlainIdInfo.schema, syncableUuidSchema);
export type SyncableId = typeof syncableIdSchema.valueType;
