import type { BundleFileAccessor } from './BundleFileAccessor.ts';
import type { FlatFileAccessor } from './FlatFileAccessor.ts';

export type FileAccessor = FlatFileAccessor | BundleFileAccessor;
