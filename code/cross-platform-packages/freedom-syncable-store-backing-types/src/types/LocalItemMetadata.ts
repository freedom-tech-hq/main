import { sha256HashInfo } from 'freedom-basic-data';
import { schema } from 'yaschema';

export const localItemMetadataSchema = schema.object({
  hash: sha256HashInfo.schema.optional()
});
export type LocalItemMetadata = typeof localItemMetadataSchema.valueType;
