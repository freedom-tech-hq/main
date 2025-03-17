import type { MutableObjectStore } from '../types/MutableObjectStore.ts';
import { makePrefixedKeyObjectStore } from './makePrefixedKeyObjectStore.ts';

export const makePrefixedKeyMutableObjectStore = <KeyPrefixT extends string, KeyT extends string, T>(
  prefix: KeyPrefixT,
  objectStore: MutableObjectStore<`${KeyPrefixT}${KeyT}`, T>
): MutableObjectStore<KeyT, T> => ({
  ...makePrefixedKeyObjectStore<KeyPrefixT, KeyT, T>(prefix, objectStore),
  mutableObject: (key: KeyT) => objectStore.mutableObject(`${prefix}${key}`)
});
