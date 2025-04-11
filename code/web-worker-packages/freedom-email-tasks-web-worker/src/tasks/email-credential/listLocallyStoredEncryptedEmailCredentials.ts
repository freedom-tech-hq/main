import type { PR } from 'freedom-async';
import { allResultsMapped, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Uuid } from 'freedom-basic-data';

import { listKvKeys } from '../../internal/utils/listKvKeys.ts';
import { readKV } from '../../internal/utils/readKV.ts';

export interface EmailCredentialInfo {
  description?: string;
  localUuid: Uuid;
}

export const listLocallyStoredEncryptedEmailCredentials = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace): PR<EmailCredentialInfo[]> => {
    const keys = await listKvKeys(trace);
    if (!keys.ok) {
      return keys;
    }

    const matchingKeys = keys.value.filter((key) => key.startsWith('EMAIL_CREDENTIAL_') && key.endsWith('.encrypted'));

    return await allResultsMapped(trace, matchingKeys, {}, async (trace, key) => {
      const localUuid = key.substring('EMAIL_CREDENTIAL_'.length, key.length - '.encrypted'.length) as Uuid;
      const description = await readKV(trace, `EMAIL_CREDENTIAL_${localUuid}.description`);
      if (!description.ok) {
        return description;
      }

      return makeSuccess({ description: description.value, localUuid });
    });
  }
);
