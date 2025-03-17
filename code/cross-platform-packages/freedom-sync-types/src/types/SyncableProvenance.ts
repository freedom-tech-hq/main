import { base64String, sha256HashInfo } from 'freedom-basic-data';
import { makeSignedValue } from 'freedom-crypto-data';

import type { SignedSyncableAcceptance } from './SyncableAcceptance.ts';
import type { SignedSyncableOrigin, SyncableOrigin, SyncableOriginSignatureExtras } from './SyncableOrigin.ts';
import { syncableOriginSchema, syncableOriginSignatureExtrasSchema } from './SyncableOrigin.ts';

export interface SyncableProvenance {
  origin: SignedSyncableOrigin;
  acceptance?: SignedSyncableAcceptance;
}

/** Use in places where a provenance value is expected but not really possible or necessary (like for internal copies of data) */
export const invalidProvenance: SyncableProvenance = {
  origin: makeSignedValue<SyncableOrigin, SyncableOriginSignatureExtras>({
    signature: base64String.makeWithUtf8String(''),
    value: { contentHash: sha256HashInfo.make('') },
    valueSchema: syncableOriginSchema,
    signatureExtrasSchema: syncableOriginSignatureExtrasSchema
  })
};
