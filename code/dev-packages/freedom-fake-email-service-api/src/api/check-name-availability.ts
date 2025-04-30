import { makeFailureWithCodeSchemas } from 'freedom-basic-data';
import { StatusCodes } from 'http-status-codes';
import { schema } from 'yaschema';
import { makeHttpApi } from 'yaschema-api';

import { emailNameSchema } from '../types/exports.ts';

export const GET = makeHttpApi({
  method: 'GET',
  routeType: 'rest',
  url: '/api/check-name-availability',
  isSafeToRetry: true,
  schemas: {
    request: {
      query: schema.object({
        name: emailNameSchema
      })
    },
    successResponse: {
      status: schema.number(StatusCodes.OK),
      body: schema.object({
        // It would be strange to return negative value as error
        available: schema.boolean()
      })
    },
    failureResponse: makeFailureWithCodeSchemas()
  }
});
