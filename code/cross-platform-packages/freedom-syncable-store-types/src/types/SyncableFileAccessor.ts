import type { PRFunc } from 'freedom-async';
import type { SyncableFileMetadata } from 'freedom-sync-types';

import type { SyncableItemAccessorBase } from './SyncableItemAccessorBase.ts';

export interface SyncableFileAccessor extends SyncableItemAccessorBase {
  readonly type: 'file';

  /** Gets the current contents of the file as binary data. */
  readonly getBinary: PRFunc<Uint8Array>;

  /** Gets the current contents of the file as binary data, without decoding it. */
  readonly getEncodedBinary: PRFunc<Uint8Array>;

  /** Gets the metadata */
  readonly getMetadata: PRFunc<SyncableFileMetadata>;
}
