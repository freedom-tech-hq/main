import { makeIdInfo } from 'freedom-basic-data';
import { type TimeId, timeIdInfo, type TrustedTimeId, trustedTimeIdInfo } from 'freedom-crypto-data';
import { schema } from 'yaschema';

export const syncablePlainIdInfo = makeIdInfo('._');
export type SyncablePlainId = typeof syncablePlainIdInfo.schema.valueType;
export const plainId = (plainId: string) => syncablePlainIdInfo.make(plainId);

export const syncableEncryptedIdInfo = makeIdInfo('E_');
export type SyncableEncryptedId = typeof syncableEncryptedIdInfo.schema.valueType;

export const syncableIdSchema = schema.oneOf4(
  syncablePlainIdInfo.schema,
  syncableEncryptedIdInfo.schema,
  timeIdInfo.schema,
  trustedTimeIdInfo.schema
);
export type SyncableId = SyncablePlainId | SyncableEncryptedId | TimeId | TrustedTimeId;
