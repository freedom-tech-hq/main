import type { BundleManagement } from '../../types/BundleManagement.ts';
import type { MutableAccessControlledFolderAccessor } from '../../types/MutableAccessControlledFolderAccessor.ts';
import type { MutableFileStore } from '../../types/MutableFileStore.ts';

export type MutableAccessControlledFolder = MutableAccessControlledFolderAccessor & MutableFileStore & BundleManagement;
