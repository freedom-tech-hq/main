import type { FileAccessorBase } from './FileAccessorBase.ts';
import type { FileStore } from './FileStore.ts';

export interface BundleAccessor extends FileAccessorBase, FileStore {
  readonly type: 'bundle';
}
