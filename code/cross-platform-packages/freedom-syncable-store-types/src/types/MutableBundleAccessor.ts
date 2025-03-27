import type { BundleAccessor } from './BundleAccessor.ts';
import type { BundleManagement } from './BundleManagement.ts';
import type { MutableFileAccessorBase } from './MutableFileAccessorBase.ts';
import type { MutableFileStore } from './MutableFileStore.ts';

export interface MutableBundleAccessor extends BundleAccessor, MutableFileAccessorBase, MutableFileStore, BundleManagement {
  readonly type: 'bundle';
}
