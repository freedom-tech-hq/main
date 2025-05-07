import { nonNegativeIntegerSchema, sha256HashInfo } from 'freedom-basic-data';
import { schema } from 'yaschema';

export const localItemMetadataSchema = schema.object({
  hash: sha256HashInfo.schema,
  /** The total number of descendants (if a folder / bundle) or `0` / `undefined` if a file */
  numDescendants: nonNegativeIntegerSchema,
  /** The size in bytes of this file (if a file) or of all descendant files (if a folder / bundle) */
  sizeBytes: nonNegativeIntegerSchema
});
export type LocalItemMetadata = typeof localItemMetadataSchema.valueType;
