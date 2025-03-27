import type { FileAccessor } from './FileAccessor.ts';
import type { MutableBundleAccessor } from './MutableBundleAccessor.ts';
import type { MutableFlatFileAccessor } from './MutableFlatFileAccessor.ts';

export type MutableFileAccessor = FileAccessor & (MutableFlatFileAccessor | MutableBundleAccessor);
