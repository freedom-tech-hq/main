import type { PRFunc } from 'freedom-async';
import type { TrustedTime } from 'freedom-trusted-time-source';

import type { WatchableDocument } from './WatchableDocument.ts';

export interface SaveableDocument<DocumentT> extends WatchableDocument<DocumentT> {
  save: PRFunc<undefined, 'conflict', [{ trustedTime?: TrustedTime }?]>;
}
