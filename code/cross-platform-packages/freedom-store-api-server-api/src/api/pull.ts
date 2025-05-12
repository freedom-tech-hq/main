import { makeFailureWithCodeSchemas } from 'freedom-basic-data';
import { pullItemSchema, syncPullArgsSchema } from 'freedom-sync-types';
import { StatusCodes } from 'http-status-codes';
import { schema } from 'yaschema';
import { makeHttpApi } from 'yaschema-api';

export const POST = makeHttpApi({
  method: 'POST',
  routeType: 'rest',
  url: '/api/pull',
  isSafeToRetry: true,
  schemas: {
    request: {
      body: syncPullArgsSchema
    },
    successResponse: {
      status: schema.number(StatusCodes.OK),
      body: pullItemSchema
    },
    failureResponse: makeFailureWithCodeSchemas('not-found')
  }
});
