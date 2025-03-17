import { makeSuccess } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import { makeAffixedKeyIndexStore } from 'freedom-indexing-types';

import type { ObjectStore } from '../types/ObjectStore.ts';

export const makePrefixedKeyObjectStore = <KeyPrefixT extends string, KeyT extends string, T>(
  prefix: KeyPrefixT,
  objectStore: ObjectStore<`${KeyPrefixT}${KeyT}`, T>
): ObjectStore<KeyT, T> => ({
  uid: JSON.stringify({ prefixedKeyObjectStoreUid: objectStore.uid, prefix }),

  keys: makeAffixedKeyIndexStore<KeyPrefixT, KeyT, '', unknown>({ prefix, suffix: '' }, objectStore.keys),

  object: (key: KeyT) => objectStore.object(`${prefix}${key}`),
  getMultiple: async (trace: Trace, keys: KeyT[]) => {
    const values = await objectStore.getMultiple(
      trace,
      keys.map((key): `${KeyPrefixT}${KeyT}` => `${prefix}${key}`)
    );
    /* node:coverage disable */
    if (!values.ok) {
      return values;
    }
    /* node:coverage enable */

    return makeSuccess({
      found: (Object.entries(values.value.found) as Array<[`${KeyPrefixT}${KeyT}`, T]>).reduce(
        (out: Partial<Record<KeyT, T>>, [key, value]) => {
          out[key.substring(prefix.length) as KeyT] = value;
          return out;
        },
        {}
      ),
      notFound: values.value.notFound.map((key): KeyT => key.substring(prefix.length) as KeyT)
    });
  }
});
