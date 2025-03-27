import type { InSyncBundle } from './InSyncBundle.ts';
import type { InSyncFlatFile } from './InSyncFlatFile.ts';
import type { InSyncFolder } from './InSyncFolder.ts';
import type { OutOfSyncBundle } from './OutOfSyncBundle.ts';
import type { OutOfSyncFlatFile } from './OutOfSyncFlatFile.ts';
import type { OutOfSyncFolder } from './OutOfSyncFolder.ts';

export type SyncPullResponse = InSyncFolder | OutOfSyncFolder | InSyncFlatFile | OutOfSyncFlatFile | InSyncBundle | OutOfSyncBundle;
