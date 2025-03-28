import type { Uuid } from 'freedom-basic-data';
import { makeIdInfo, uuidSchema } from 'freedom-basic-data';
import { schema } from 'yaschema';

export const syncablePlainIdInfo = makeIdInfo('._');
export type SyncablePlainId = typeof syncablePlainIdInfo.schema.valueType;
export const plainId = (plainId: string) => syncablePlainIdInfo.make(plainId);

export const saltIdInfo = makeIdInfo('SALT_');
export type SaltId = typeof saltIdInfo.schema.valueType;

export const defaultSaltId = saltIdInfo.make('default');

export const syncableSaltedIdInfo = makeIdInfo('S_');
export type SyncableSaltedId = typeof syncableSaltedIdInfo.schema.valueType;

export const syncableUuidSchema = uuidSchema;
export type SyncableUuidId = Uuid;

export const syncableIdSchema = schema.oneOf3(syncablePlainIdInfo.schema, syncableSaltedIdInfo.schema, syncableUuidSchema);
export type SyncableId = typeof syncableIdSchema.valueType;
