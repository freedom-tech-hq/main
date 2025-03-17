import type { FileAccessorBase } from './FileAccessorBase.ts';
import type { FileStore } from './FileStore.ts';

export interface BundleFileAccessor extends FileAccessorBase, FileStore {
  readonly type: 'bundleFile';
}
