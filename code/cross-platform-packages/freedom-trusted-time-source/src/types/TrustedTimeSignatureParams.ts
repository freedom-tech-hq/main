import { sha256HashInfo, timeIdInfo } from 'freedom-basic-data';
import { schema } from 'yaschema';

export const trustedTimeSignatureParamsSchema = schema.object({
  timeId: timeIdInfo.schema,
  parentPath: schema.string(),
  contentHash: sha256HashInfo.schema
});
export type TrustedTimeSignatureParams = typeof trustedTimeSignatureParamsSchema.valueType;
