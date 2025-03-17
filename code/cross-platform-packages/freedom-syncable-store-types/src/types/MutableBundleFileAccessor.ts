import type { BundleFileAccessor } from './BundleFileAccessor.ts';
import type { MutableFileAccessorBase } from './MutableFileAccessorBase.ts';
import type { MutableFileStore } from './MutableFileStore.ts';

export interface MutableBundleFileAccessor extends BundleFileAccessor, MutableFileAccessorBase, MutableFileStore {
  readonly type: 'bundleFile';
}
