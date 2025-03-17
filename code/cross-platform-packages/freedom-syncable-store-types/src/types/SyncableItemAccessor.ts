import type { AccessControlledFolderAccessor } from './AccessControlledFolderAccessor.ts';
import type { FileAccessor } from './FileAccessor.ts';

export type SyncableItemAccessor = FileAccessor | AccessControlledFolderAccessor;
