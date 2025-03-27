import { sha256HashInfo } from 'freedom-basic-data';
import { syncableIdSchema } from 'freedom-sync-types';
import { schema } from 'yaschema';

export const fileSystemChangeableLocalItemMetadataSchema = schema.object({
  hash: sha256HashInfo.schema.optional()
});
export type FileSystemChangeableLocalItemMetadata = typeof fileSystemChangeableLocalItemMetadataSchema.valueType;

export const fileSystemLocalItemMetadataSchema = schema.extendsObject(
  fileSystemChangeableLocalItemMetadataSchema,
  schema.object({
    id: syncableIdSchema
  })
);
export type FileSystemLocalItemMetadata = typeof fileSystemLocalItemMetadataSchema.valueType;
