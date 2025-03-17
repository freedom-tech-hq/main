export type GetOrCreateLockStoreArgs<KeyT extends string> = {
  id: string;
  version: number;
  _keyType?: KeyT;
};
