import type { AccessChange } from 'freedom-access-control-types';
import { makeAccessChangeSchema } from 'freedom-access-control-types';
import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { InternalSchemaValidationError } from 'freedom-common-errors';
import { generateSha256HashFromString } from 'freedom-crypto';

import type { SyncableStoreRole } from '../types/SyncableStoreRole.ts';
import { syncableStoreRoleSchema } from '../types/SyncableStoreRole.ts';

const accessChangeSchema = makeAccessChangeSchema({ roleSchema: syncableStoreRoleSchema });

export const generateContentHashForSyncableStoreAccessChange = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, accessChange: AccessChange<SyncableStoreRole>): PR<Sha256Hash> => {
    const serialization = await accessChangeSchema.serializeAsync(accessChange);
    if (serialization.error !== undefined) {
      return makeFailure(new InternalSchemaValidationError(trace, { message: serialization.error }));
    }

    return generateSha256HashFromString(trace, JSON.stringify(serialization.serialized));
  }
);
