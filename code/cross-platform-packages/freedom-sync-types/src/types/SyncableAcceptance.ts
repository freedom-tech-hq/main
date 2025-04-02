import { makeSignedValueSchema } from 'freedom-crypto-data';
import { trustedTimeSchema } from 'freedom-trusted-time-source';

export const syncableAcceptanceSchema = trustedTimeSchema;
export type SyncableAcceptance = typeof syncableAcceptanceSchema.valueType;

export const signedSyncableAcceptanceSchema = makeSignedValueSchema(syncableAcceptanceSchema, undefined);
export type SignedSyncableAcceptance = typeof signedSyncableAcceptanceSchema.valueType;
