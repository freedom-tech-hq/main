import type { InSyncBundle } from './InSyncBundle.ts';
import type { InSyncFile } from './InSyncFile.ts';
import type { InSyncFolder } from './InSyncFolder.ts';
import type { OutOfSyncBundle } from './OutOfSyncBundle.ts';
import type { OutOfSyncFile } from './OutOfSyncFile.ts';
import type { OutOfSyncFolder } from './OutOfSyncFolder.ts';

export type SyncPullResponse = InSyncFolder | OutOfSyncFolder | InSyncFile | OutOfSyncFile | InSyncBundle | OutOfSyncBundle;
