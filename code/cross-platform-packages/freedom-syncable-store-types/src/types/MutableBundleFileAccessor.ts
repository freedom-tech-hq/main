import type { BundleFileAccessor } from './BundleFileAccessor.ts';
import type { MutableFileAccessorBase } from './MutableFileAccessorBase.ts';
import type { MutableFileStore } from './MutableFileStore.ts';
import type { PRFunc } from 'freedom-async';

export interface MutableBundleFileAccessor extends BundleFileAccessor, MutableFileAccessorBase, MutableFileStore {
  readonly type: 'bundleFile';

  // Pavel's note: not sure where this should be. It is from InMemoryMutableBundleFileAccessor
  readonly sweep: PRFunc<undefined>;
}
