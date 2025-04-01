import { makeFailureWithCodeSchemas } from 'freedom-basic-data';
import { combinationCryptoKeySetSchema } from 'freedom-crypto-data';
import { saltsByIdSchema, storageRootIdInfo, syncableItemMetadataSchema } from 'freedom-sync-types';
import { StatusCodes } from 'http-status-codes';
import { schema } from 'yaschema';
import { makeHttpApi } from 'yaschema-api';

export const POST = makeHttpApi({
  method: 'POST',
  routeType: 'rest',
  url: '/api/register',
  isSafeToRetry: true,
  schemas: {
    request: {
      body: schema.object({
        storageRootId: storageRootIdInfo.schema,
        metadata: schema.omit(syncableItemMetadataSchema, ['name']),
        creatorPublicKeys: combinationCryptoKeySetSchema,
        saltsById: saltsByIdSchema
      })
    },
    successResponse: {
      status: schema.number(StatusCodes.OK)
    },
    failureResponse: makeFailureWithCodeSchemas('conflict')
  }
});
