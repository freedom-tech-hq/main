import { syncPushArgsSchema } from 'freedom-sync-types';
import { StatusCodes } from 'http-status-codes';
import { schema } from 'yaschema';
import { makeHttpApi } from 'yaschema-api';

export const POST = makeHttpApi({
  method: 'POST',
  routeType: 'rest',
  url: '/api/push',
  isSafeToRetry: true,
  schemas: {
    request: {
      body: syncPushArgsSchema
    },
    successResponse: {
      status: schema.number(StatusCodes.OK)
    }
  }
});
