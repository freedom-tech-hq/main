import { allResultsNamed, makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { Cast } from 'freedom-cast';
import type { SaltId } from 'freedom-sync-types';
import { DEFAULT_SALT_ID } from 'freedom-sync-types';
import { schema } from 'yaschema';

import type { EmailUserId } from '../../../../types/EmailUserId.ts';
import { EMAIL_APP_SALT_ID } from '../../../consts/salt-ids.ts';
import { useDataSources } from '../../../contexts/data-sources.ts';
import { getOrCreateSalt } from './getOrCreateSalt.ts';

export const getOrCreateEmailAppSaltsForUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { userId }: { userId: EmailUserId }) => {
    const dataSources = useDataSources(trace);
    const saltStore = await uncheckedResult(
      dataSources.getOrCreateSecretStore(trace, {
        id: `${userId}:email-app-salts`,
        version: 0,
        schema: schema.string(),
        _keyType: Cast<SaltId>()
      })
    );

    const salts = await allResultsNamed(
      trace,
      {},
      {
        [DEFAULT_SALT_ID]: getOrCreateSalt(trace, saltStore, DEFAULT_SALT_ID),
        [EMAIL_APP_SALT_ID]: getOrCreateSalt(trace, saltStore, EMAIL_APP_SALT_ID)
      }
    );
    if (!salts.ok) {
      return salts;
    }

    return makeSuccess(salts.value);
  }
);
