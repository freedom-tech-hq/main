import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { Cast } from 'freedom-cast';
import type { CryptoKeySetId, PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import { privateCombinationCryptoKeySetSchema } from 'freedom-crypto-data';
import type { MutableObjectStore } from 'freedom-object-store-types';
import { makePrefixedKeyMutableObjectStore } from 'freedom-object-store-types';

import type { EmailUserId } from '../../../../types/EmailUserId.ts';
import { useDataSources } from '../../../contexts/data-sources.ts';

export const getCryptoKeysDb = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace): PR<({ userId }: { userId: EmailUserId }) => MutableObjectStore<CryptoKeySetId, PrivateCombinationCryptoKeySet>> => {
    const dataSources = useDataSources(trace);

    const secretStore = await dataSources.getOrCreateSecretStore(trace, {
      id: 'photos-signing-and-verifying-keys',
      schema: privateCombinationCryptoKeySetSchema,
      version: 0,
      _keyType: Cast<`${EmailUserId}.${CryptoKeySetId}`>()
    });
    if (!secretStore.ok) {
      return secretStore;
    }

    return makeSuccess(({ userId }: { userId: EmailUserId }) =>
      makePrefixedKeyMutableObjectStore<`${EmailUserId}.`, CryptoKeySetId, PrivateCombinationCryptoKeySet>(`${userId}.`, secretStore.value)
    );
  }
);
