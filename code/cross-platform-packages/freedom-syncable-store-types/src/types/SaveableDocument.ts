import type { PRFunc } from 'freedom-async';
import type { TrustedTime } from 'freedom-trusted-time-source';

import type { WatchableDocument } from './WatchableDocument.ts';

export interface SaveableDocument<DocumentT> extends WatchableDocument<DocumentT> {
  save: PRFunc<undefined, 'conflict', [{ trustedTime?: TrustedTime }?]>;

  /** Debounced save that uses doSoon (with the trace service context).  If multiple tasks need to save at about the same time, this will
   * reduce the total number of saves by debouncing them.  This can't be used when `trustedTime` is required. */
  saveSoon: PRFunc<undefined, 'conflict'>;
}
