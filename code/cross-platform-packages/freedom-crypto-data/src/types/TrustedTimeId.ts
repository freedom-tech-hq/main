import type { IsoDateTime, Uuid } from 'freedom-basic-data';
import { makeIdInfo, MAX_ID_LENGTH, MIN_ID_LENGTH, sha256HashInfo } from 'freedom-basic-data';
import { schema } from 'yaschema';

import { makeSignedValueSchema } from './SignedValue.ts';

export const trustedTimeIdInfo = makeIdInfo('TT_');
/** The post-suffix contents of `TrustedTimeId` are serialized `SignedTimeId` */
export type TrustedTimeId = typeof trustedTimeIdInfo.schema.valueType;

/**
 * Format: `<ISO time>-<UUID>`
 *
 * Example: `2025-01-01T01:23:45.678Z-01234567-89ab-cdef-0123-456789abcdef`
 */
export const timeIdInfo = makeIdInfo<'T_', `${IsoDateTime}-${Uuid}`>('T_', {
  schemaOverride: schema
    .regex<`T_${IsoDateTime}-${Uuid}`>(/^T_\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z-[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}$/)
    .setAllowedLengthRange('T_'.length + MIN_ID_LENGTH, 'T_'.length + MAX_ID_LENGTH)
});
export type TimeId = typeof timeIdInfo.schema.valueType;

export const signedTimeIdSignatureExtrasSchema = schema.object({
  parentPathHash: sha256HashInfo.schema,
  contentHash: sha256HashInfo.schema
});
export type SignedTimeIdSignatureExtras = typeof signedTimeIdSignatureExtrasSchema.valueType;

export const signedTimeIdSchema = makeSignedValueSchema(timeIdInfo.schema, signedTimeIdSignatureExtrasSchema);
export type SignedTimeId = typeof signedTimeIdSchema.valueType;
