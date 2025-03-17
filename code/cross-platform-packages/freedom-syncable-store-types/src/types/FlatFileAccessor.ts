import type { PRFunc } from 'freedom-async';

import type { FileAccessorBase } from './FileAccessorBase.ts';

export interface FlatFileAccessor extends FileAccessorBase {
  readonly type: 'flatFile';

  /** Gets the current contents of the file as binary data. */
  readonly getBinary: PRFunc<Uint8Array>;

  /** Gets the current contents of the file as binary data, without decoding it. */
  readonly getEncodedBinary: PRFunc<Uint8Array>;
}
