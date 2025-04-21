import type { SyncablePath } from 'freedom-sync-types';

export interface ConflictFreeDocumentBundleNeedsReloadEvent {
  path: SyncablePath;
}

export interface ConflictFreeDocumentBundleWillApplyDeltasEvent {
  path: SyncablePath;
}

export interface ConflictFreeDocumentBundleDidApplyDeltasEvent {
  path: SyncablePath;
  numDeltasApplied: number;
}

export type ConflictFreeDocumentBundleNotifications = {
  needsReload: ConflictFreeDocumentBundleNeedsReloadEvent;
  willApplyDeltas: ConflictFreeDocumentBundleWillApplyDeltasEvent;
  didApplyDeltas: ConflictFreeDocumentBundleDidApplyDeltasEvent;
};
