import { schema } from 'yaschema';

export type IsoDateTime = `${string}-${string}-${string}T${string}:${string}:${string}.${string}Z`;
export const nonAnchoredIsoDateTimeRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/;
export const isoDateTimeSchema = schema.regex<IsoDateTime>(new RegExp(`^(?:${nonAnchoredIsoDateTimeRegex.source})$`));
