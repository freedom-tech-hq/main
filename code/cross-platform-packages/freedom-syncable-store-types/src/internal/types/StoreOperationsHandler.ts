import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { SyncablePath } from 'freedom-sync-types';

import { ACCESS_CONTROL_BUNDLE_FILE_ID } from '../../consts/special-file-ids.ts';

export class StoreOperationsHandler {
  public readonly shouldUseTrustedTimeIdsInPath = makeAsyncResultFunc(
    [import.meta.filename, 'shouldUseTrustedTimeIdsInPath'],
    async (_trace, path: SyncablePath): PR<boolean, never> => makeSuccess(path.ids.includes(ACCESS_CONTROL_BUNDLE_FILE_ID))
  );
}
