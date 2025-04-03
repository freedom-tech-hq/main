import { combinationCryptoKeySetSchema } from 'freedom-crypto-data';
import { StatusCodes } from 'http-status-codes';
import { schema } from 'yaschema';
import { makeHttpApi } from 'yaschema-api';

export const GET = makeHttpApi({
  method: 'GET',
  routeType: 'rest',
  url: '/api/public-keys',
  isSafeToRetry: true,
  schemas: {
    request: {},
    successResponse: {
      status: schema.number(StatusCodes.OK),
      body: combinationCryptoKeySetSchema
    }
  }
});
