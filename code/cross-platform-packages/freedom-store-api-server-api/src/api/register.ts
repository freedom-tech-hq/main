import { makeFailureWithCodeSchemas } from 'freedom-basic-data';
import { combinationCryptoKeySetSchema } from 'freedom-crypto-data';
import { saltsByIdSchema, storageRootIdInfo, syncableItemMetadataSchema } from 'freedom-sync-types';
import { StatusCodes } from 'http-status-codes';
import { schema } from 'yaschema';
import { makeHttpApi } from 'yaschema-api';

import { emailNameSchema } from '../types/exports.ts';

export const POST = makeHttpApi({
  method: 'POST',
  routeType: 'rest',
  url: '/api/register',
  isSafeToRetry: true,
  schemas: {
    request: {
      body: schema.object({
        name: emailNameSchema,
        storageRootId: storageRootIdInfo.schema,
        metadata: schema.omit(syncableItemMetadataSchema, ['name']),
        creatorPublicKeys: combinationCryptoKeySetSchema,
        saltsById: saltsByIdSchema
      })
    },
    successResponse: {
      status: schema.number(StatusCodes.OK)
    },
    failureResponse: makeFailureWithCodeSchemas(
      'already-created', // It is clearly the same user
      'conflict', // The user ID is already known, but the user is different
      'email-is-unavailable' // The email is already taken by another user
    )
  }
});
