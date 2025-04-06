import type { AccessChange } from 'freedom-access-control-types';
import { makeAccessChangeSchema } from 'freedom-access-control-types';
import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { generateSha256HashFromString } from 'freedom-crypto';
import { serialize } from 'freedom-serialization';

import type { SyncableStoreRole } from '../types/SyncableStoreRole.ts';
import { syncableStoreRoleSchema } from '../types/SyncableStoreRole.ts';

const accessChangeSchema = makeAccessChangeSchema({ roleSchema: syncableStoreRoleSchema });

export const generateContentHashForSyncableStoreAccessChange = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, accessChange: AccessChange<SyncableStoreRole>): PR<Sha256Hash> => {
    const serialization = await serialize(trace, accessChange, accessChangeSchema);
    if (!serialization.ok) {
      return serialization;
    }

    return await generateSha256HashFromString(trace, JSON.stringify(serialization.value.serializedValue));
  }
);
