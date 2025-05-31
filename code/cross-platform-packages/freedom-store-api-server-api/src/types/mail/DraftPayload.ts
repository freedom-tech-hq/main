import { schema } from 'yaschema';

/**
 * Sub-set of Message fields accepted when creating or editing an unsent message (draft).
 * Deliberately omits server-controlled data such as ids, timestamps, labels and transport diagnostics.
 */
export const draftPayloadSchema = schema.object({
  subject: schema.string().optional(),
  from: schema.string().optional(),
  to: schema.array(schema.string()).optional(),
  cc: schema.array(schema.string()).optional(),
  bcc: schema.array(schema.string()).optional(),
  replyTo: schema.string().optional(),
  bodyParts: schema.array(schema.any()).optional(), // Replace with actual bodyPart schema if available
  attachments: schema.array(schema.any()).optional(), // Replace with actual attachment schema if available
  inReplyTo: schema.string().optional(),
  references: schema.array(schema.string()).optional()
});

export type DraftPayload = typeof draftPayloadSchema.valueType;
