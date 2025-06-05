import { schema } from 'yaschema';

import { mailIdInfo } from './MailId.ts';
import { mailThreadIdInfo } from './MailThreadId.ts';

export const nonAnchoredMailThreadLikeIdRegex = new RegExp(
  `(?:${mailThreadIdInfo.nonAnchoredRegex.source})|(?:${mailIdInfo.nonAnchoredRegex.source})`
);
export const mailThreadLikeIdSchema = schema.oneOf(mailThreadIdInfo.schema, mailIdInfo.schema);
export type MailThreadLikeId = typeof mailThreadLikeIdSchema.valueType;
