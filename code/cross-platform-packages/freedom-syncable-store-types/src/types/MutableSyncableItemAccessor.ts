import type { MutableAccessControlledFolderAccessor } from './MutableAccessControlledFolderAccessor.ts';
import type { MutableFileAccessor } from './MutableFileAccessor.ts';
import type { SyncableItemAccessor } from './SyncableItemAccessor.ts';

export type MutableSyncableItemAccessor = SyncableItemAccessor & (MutableFileAccessor | MutableAccessControlledFolderAccessor);
