import { schema } from 'yaschema';

export const mailPrioritySchema = schema.string('normal', 'low', 'high');
export type MailPriority = typeof mailPrioritySchema.valueType;
