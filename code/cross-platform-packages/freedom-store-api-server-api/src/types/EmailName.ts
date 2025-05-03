import { schema } from 'yaschema';

export const emailNameSchema = schema
  .regex(/^[a-zA-Z0-9.-]+$/)
  .setAllowedLengthRange(1, 64)
  .setDescription('Email name (the part before @ in the email address)');

export type EmailName = string;
