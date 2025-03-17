import { schema } from 'yaschema';

export const authHeadersSchema = schema.object({
  /** When using cookie-based authorization headers, pass an empty value.  This is more of a reminder for which requests are
   * authenticated. */
  authorization: schema.string().allowEmptyString()
});
export type AuthHeaders = typeof authHeadersSchema.valueType;

export const partialAuthHeadersSchema = schema.partial(authHeadersSchema);
export type PartialAuthHeaders = typeof partialAuthHeadersSchema.valueType;

export const optionalAuthHeadersSchema = partialAuthHeadersSchema.optional();
export type OptionalAuthHeaders = typeof optionalAuthHeadersSchema.valueType;
