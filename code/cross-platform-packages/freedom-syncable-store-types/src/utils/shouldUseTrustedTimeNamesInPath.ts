import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { OldSyncablePath } from 'freedom-sync-types';

import { ACCESS_CONTROL_BUNDLE_ID } from '../consts/special-file-ids.ts';
import type { SyncableStore } from '../types/SyncableStore.ts';

export const shouldUseTrustedTimeNamesInPath = makeAsyncResultFunc(
  [import.meta.filename, 'shouldUseTrustedTimeNamesInPath'],
  async (_trace, _store: SyncableStore, path: OldSyncablePath): PR<boolean> => makeSuccess(path.ids.includes(ACCESS_CONTROL_BUNDLE_ID))
);
