import type { IndexConfig } from 'freedom-indexing-types';

export type GetOrCreateIndexStoreArgs<KeyT extends string, IndexedValueT> = {
  id: string;
  version: number;
  config: IndexConfig<IndexedValueT>;
  _keyType?: KeyT;
};
