import { base64String, sha256HashInfo } from 'freedom-basic-data';
import { makeSignedValue } from 'freedom-crypto-data';
import { schema } from 'yaschema';

import { signedSyncableAcceptanceSchema } from './SyncableAcceptance.ts';
import type { SyncableOrigin, SyncableOriginSignatureExtras } from './SyncableOrigin.ts';
import { signedSyncableOriginSchema, syncableOriginSchema, syncableOriginSignatureExtrasSchema } from './SyncableOrigin.ts';

export const syncableProvenanceSchema = schema.object({
  origin: signedSyncableOriginSchema,
  acceptance: signedSyncableAcceptanceSchema.optional()
});
export type SyncableProvenance = typeof syncableProvenanceSchema.valueType;

/** Use in places where a provenance value is expected but not really possible or necessary (like for internal copies of data) */
export const invalidProvenance: SyncableProvenance = {
  origin: makeSignedValue<SyncableOrigin, SyncableOriginSignatureExtras>({
    signature: base64String.makeWithUtf8String(''),
    value: { contentHash: sha256HashInfo.make('') },
    valueSchema: syncableOriginSchema,
    signatureExtrasSchema: syncableOriginSignatureExtrasSchema
  })
};
