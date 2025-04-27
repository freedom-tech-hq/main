import { StatusCodes } from 'http-status-codes';
import { schema } from 'yaschema';
import { makeHttpApi } from 'yaschema-api';

// Schema for the store credential request
export const STORE = makeHttpApi({
  method: 'POST',
  routeType: 'rest',
  url: '/api/credentials/store',
  isSafeToRetry: false,
  schemas: {
    request: {
      body: schema.object({
        lookupKeyHash: schema.string(),
        encryptedCredential: schema.string(),
        description: schema.string(),
        salt: schema.array(schema.number()),
        iv: schema.array(schema.number())
      })
    },
    successResponse: {
      status: schema.number(StatusCodes.OK),
      body: schema.object({
        success: schema.boolean(true)
      })
    }
  }
});

// Schema for the retrieve credential request
export const RETRIEVE = makeHttpApi({
  method: 'POST',
  routeType: 'rest',
  url: '/api/credentials/retrieve',
  isSafeToRetry: true,
  schemas: {
    request: {
      body: schema.object({
        lookupKeyHash: schema.string()
      })
    },
    successResponse: {
      status: schema.number(StatusCodes.OK),
      body: schema.object({
        encryptedCredential: schema.string(),
        description: schema.string(),
        salt: schema.array(schema.number()),
        iv: schema.array(schema.number())
      })
    }
  }
});