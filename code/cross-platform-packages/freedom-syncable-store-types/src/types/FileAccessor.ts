import type { BundleAccessor } from './BundleAccessor.ts';
import type { FlatFileAccessor } from './FlatFileAccessor.ts';

export type FileAccessor = FlatFileAccessor | BundleAccessor;
