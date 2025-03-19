import type { ResourceKey } from 'i18next';

type ResourceLoader = () => Promise<Record<string, ResourceKey | undefined> | undefined>;

/** For each namespace, a loader for each supported language */
const globalRegisteredNamespaceLoaders: Partial<Record<string, Partial<Record<string, ResourceLoader>>>> = {};

export const getRegisteredNamespaceLoaderForLanguage = (lng: string, ns: string) =>
  globalRegisteredNamespaceLoaders[ns]?.[lng] ?? (async () => undefined);

export const getSupportedNamespaces = () => Object.keys(globalRegisteredNamespaceLoaders);

export const registerNamespaceLoaderForLanguage = (lng: string, ns: string, loader: ResourceLoader) => {
  globalRegisteredNamespaceLoaders[ns] = globalRegisteredNamespaceLoaders[ns] ?? {};
  globalRegisteredNamespaceLoaders[ns][lng] = loader;
};
