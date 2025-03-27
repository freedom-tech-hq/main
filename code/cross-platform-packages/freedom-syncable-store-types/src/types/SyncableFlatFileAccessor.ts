import type { PRFunc } from 'freedom-async';

import type { SyncableItemAccessorBase } from './SyncableItemAccessorBase.ts';

export interface SyncableFlatFileAccessor extends SyncableItemAccessorBase {
  readonly type: 'flatFile';

  /** Gets the current contents of the file as binary data. */
  readonly getBinary: PRFunc<Uint8Array>;

  /** Gets the current contents of the file as binary data, without decoding it. */
  readonly getEncodedBinary: PRFunc<Uint8Array>;
}
