import { inline } from 'freedom-async';
import type { ResourceKey } from 'i18next';

import { getRegisteredNamespaceLoaderForLanguage } from './namespace-loaders.ts';

export const makeLoadNamespaceForLanguage = () => {
  const promises: Partial<Record<string, Promise<ResourceKey | undefined> | ResourceKey>> = {};

  return async (lng: string, ns: string): Promise<ResourceKey | undefined> => {
    const promisesKey = `${lng}::${ns}`;
    let promise = promises[promisesKey];
    if (promise !== undefined) {
      return await promise;
    }

    promise = inline(async (): Promise<ResourceKey> => {
      const loader = getRegisteredNamespaceLoaderForLanguage(lng, ns);
      const loaded = await loader();
      return loaded?.[ns] ?? {};
    });
    promises[promisesKey] = promise;
    return await promise;
  };
};
