import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { SyncablePath } from 'freedom-sync-types';

import { ACCESS_CONTROL_BUNDLE_FILE_ID } from '../consts/special-file-ids.ts';
import type { SyncableStore } from '../types/SyncableStore.ts';

export const shouldUseTrustedTimeIdsInPath = makeAsyncResultFunc(
  [import.meta.filename, 'shouldUseTrustedTimeIdsInPath'],
  async (_trace, _store: SyncableStore, path: SyncablePath): PR<boolean> => makeSuccess(path.ids.includes(ACCESS_CONTROL_BUNDLE_FILE_ID))
);
