import type { Schema } from 'yaschema';

export type GetOrCreateObjectStoreArgs<KeyT extends string, T> = {
  id: string;
  version: number;
  schema: Schema<T>;
  _keyType?: KeyT;
};
