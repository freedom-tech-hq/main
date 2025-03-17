import type { FlatFileAccessor } from './FlatFileAccessor.ts';
import type { MutableFileAccessorBase } from './MutableFileAccessorBase.ts';

export interface MutableFlatFileAccessor extends MutableFileAccessorBase, FlatFileAccessor {
  readonly type: 'flatFile';
}
