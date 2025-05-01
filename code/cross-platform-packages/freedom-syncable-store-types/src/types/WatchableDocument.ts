import type { Notifiable } from 'freedom-notification-types';

import type { ConflictFreeDocumentBundleNotifications } from './ConflictFreeDocumentBundleNotifications.ts';

export interface WatchableDocument<DocumentT> extends Notifiable<ConflictFreeDocumentBundleNotifications> {
  document: DocumentT;

  /** This is `true` if a `needsReload` notification has previously been triggered -- indicating that a newer snapshot is available */
  needsReload: boolean;

  /** Normally deltas are applied after a short debounce interval (1000 / 60ms or ~16ms).  Calling this, if there are outstanding deltas to
   * be applied, such as those recently received by syncing, will immediately apply the changes instead of waiting. */
  applyPendingDeltas: () => Promise<void>;

  /** If `watch` is `true` when calling `getConflictFreeDocumentFromBundleAtPath` or similar, `stopWatching` must be called to release the
   * associated watching resources.  This function is a noop for other `watch` values */
  stopWatching: () => void;
}
