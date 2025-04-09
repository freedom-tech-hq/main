import { sha256HashInfo } from 'freedom-basic-data';
import { schema } from 'yaschema';

export const opfsChangeableLocalItemMetadataSchema = schema.object({
  hash: sha256HashInfo.schema.optional()
});
export type OpfsChangeableLocalItemMetadata = typeof opfsChangeableLocalItemMetadataSchema.valueType;

export const opfsLocalItemMetadataSchema = opfsChangeableLocalItemMetadataSchema;
export type OpfsLocalItemMetadata = typeof opfsLocalItemMetadataSchema.valueType;
