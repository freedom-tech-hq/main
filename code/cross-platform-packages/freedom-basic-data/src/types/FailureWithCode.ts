import { schema } from 'yaschema';

import type { OptionalAuthHeaders } from './AuthHeaders.ts';
import { optionalAuthHeadersSchema } from './AuthHeaders.ts';
import { httpResponseStatusSchema } from './HttpResponseStatus.ts';

const internalMakeFailureWithCodeBodySchema = <ErrorCodeT extends string>(...errorCodes: ErrorCodeT[]) =>
  schema.object({
    errorCode: schema.string<ErrorCodeT | 'generic'>(...errorCodes, 'generic').optional(),
    message: schema.string().allowEmptyString().optional()
  });

const internalMakeFailureWithCodeSchemas = <ErrorCodeT extends string>(...errorCodes: ErrorCodeT[]) => ({
  status: httpResponseStatusSchema.not(schema.number(200)),
  headers: optionalAuthHeadersSchema,
  body: schema.oneOf(internalMakeFailureWithCodeBodySchema(...errorCodes), schema.string().allowEmptyString().optional())
});

export function makeFailureWithCodeSchemas<ErrorCodeT extends string = never>(): ReturnType<
  typeof internalMakeFailureWithCodeSchemas<ErrorCodeT>
>;
export function makeFailureWithCodeSchemas<ErrorCodeT extends string>(
  firstErrorCode: ErrorCodeT,
  ...restErrorCodes: ErrorCodeT[]
): ReturnType<typeof internalMakeFailureWithCodeSchemas<ErrorCodeT>>;
export function makeFailureWithCodeSchemas<ErrorCodeT extends string>(...errorCodes: ErrorCodeT[]) {
  return internalMakeFailureWithCodeSchemas(...errorCodes);
}

export interface FailureWithCode<ErrorCodeT extends string> {
  status: number;
  headers?: OptionalAuthHeaders;
  body?: { errorCode?: ErrorCodeT; message?: string } | string;
}
