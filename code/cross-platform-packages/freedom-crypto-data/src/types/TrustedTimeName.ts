import type { IsoDateTime, Uuid } from 'freedom-basic-data';
import { makeIdInfo, MAX_ID_LENGTH, MIN_ID_LENGTH, sha256HashInfo } from 'freedom-basic-data';
import { schema } from 'yaschema';

import { makeSignedValueSchema } from './SignedValue.ts';

export const trustedTimeNameInfo = makeIdInfo('TT_');
/** The post-suffix contents of `TrustedTimeName` are serialized `SignedTimeName` */
export type TrustedTimeName = typeof trustedTimeNameInfo.schema.valueType;

/**
 * Format: `<ISO time>-<UUID>`
 *
 * Example: `2025-01-01T01:23:45.678Z-01234567-89ab-cdef-0123-456789abcdef`
 */
export const timeNameInfo = makeIdInfo<'T_', `${IsoDateTime}-${Uuid}`>('T_', {
  schemaOverride: schema
    .regex<`T_${IsoDateTime}-${Uuid}`>(/^T_\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z-[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}$/)
    .setAllowedLengthRange('T_'.length + MIN_ID_LENGTH, 'T_'.length + MAX_ID_LENGTH)
});
export type TimeName = typeof timeNameInfo.schema.valueType;

export const signedTimeNameSignatureExtrasSchema = schema.object({
  pathHash: sha256HashInfo.schema,
  contentHash: sha256HashInfo.schema
});
export type SignedTimeNameSignatureExtras = typeof signedTimeNameSignatureExtrasSchema.valueType;

export const signedTimeNameSchema = makeSignedValueSchema(timeNameInfo.schema, signedTimeNameSignatureExtrasSchema);
export type SignedTimeName = typeof signedTimeNameSchema.valueType;
