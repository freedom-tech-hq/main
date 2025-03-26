import { sha256HashInfo } from 'freedom-basic-data';
import { schema } from 'yaschema';

export const localMetadataSchema = schema.object({
  hash: sha256HashInfo.schema.optional()
});
