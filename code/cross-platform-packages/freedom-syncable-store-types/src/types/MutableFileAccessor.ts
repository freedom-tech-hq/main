import type { FileAccessor } from './FileAccessor.ts';
import type { MutableBundleFileAccessor } from './MutableBundleFileAccessor.ts';
import type { MutableFlatFileAccessor } from './MutableFlatFileAccessor.ts';

export type MutableFileAccessor = FileAccessor & (MutableFlatFileAccessor | MutableBundleFileAccessor);
