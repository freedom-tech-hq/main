import { sha256HashInfo } from 'freedom-basic-data';
import { schema } from 'yaschema';

export const fileSystemChangeableLocalItemMetadataSchema = schema.object({
  hash: sha256HashInfo.schema.optional()
});
export type FileSystemChangeableLocalItemMetadata = typeof fileSystemChangeableLocalItemMetadataSchema.valueType;

export const fileSystemLocalItemMetadataSchema = fileSystemChangeableLocalItemMetadataSchema;
export type FileSystemLocalItemMetadata = typeof fileSystemLocalItemMetadataSchema.valueType;
