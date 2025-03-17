export interface KeyIndexConfig {
  type: 'key';
}

export type NumericValueIndexConfig<IndexedValueT> = IndexedValueT extends number ? { type: 'numeric' } : never;

export type StringValueIndexConfig<IndexedValueT> = IndexedValueT extends string ? { type: 'string' } : never;

export type IndexConfig<IndexedValueT> = { type: string } & (
  | KeyIndexConfig
  | NumericValueIndexConfig<IndexedValueT>
  | StringValueIndexConfig<IndexedValueT>
);
