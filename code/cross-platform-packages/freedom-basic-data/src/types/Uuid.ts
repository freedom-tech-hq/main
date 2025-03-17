import { schema } from 'yaschema';

export type Uuid = `${string}-${string}-${string}-${string}-${string}`;
export const nonAnchoredUuidRegex = /[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}/;
export const uuidSchema = schema.regex<Uuid>(/^[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}$/);
