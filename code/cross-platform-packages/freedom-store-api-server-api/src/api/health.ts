import { StatusCodes } from 'http-status-codes';
import { schema } from 'yaschema';
import { makeHttpApi } from 'yaschema-api';

export const GET = makeHttpApi({
  method: 'GET',
  routeType: 'rest',
  url: '/api/health',
  isSafeToRetry: true,
  schemas: {
    request: {},
    successResponse: {
      status: schema.number(StatusCodes.OK),
      body: schema.object({
        version: schema.string(),
        startedAt: schema.date(),
        healthy: schema.boolean()
      })
    }
  }
});
