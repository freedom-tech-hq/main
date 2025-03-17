import type { Trace } from 'freedom-contexts';

import type { PR } from '../types/PR.ts';
import type { PRFunc } from '../types/PRFunc.ts';
import { makeSuccess } from '../types/Result.ts';
import { makeAsyncResultFunc } from './makeAsyncResultFunc.ts';

/** While non-empty batches are successfully returned via `getBatch`, runs `doWithBatch` and waits for the result.  Stops if `doWithBatch`
 * fails. */
export const doInBatches = makeAsyncResultFunc(
  [import.meta.filename],
  async <ItemT, ErrorCodeT extends string = never>(
    trace: Trace,
    getBatch: PRFunc<ItemT[], ErrorCodeT, [offset: number]>,
    doWithBatch: PRFunc<any, ErrorCodeT, [batch: ItemT[]]>
  ): PR<undefined, ErrorCodeT> => {
    let skip = 0;
    while (true) {
      const items = await getBatch(trace, skip);
      if (!items.ok) {
        return items;
      }
      if (items.value.length === 0) {
        return makeSuccess(undefined);
      }

      skip += items.value.length;

      const processed = await doWithBatch(trace, items.value);
      if (!processed.ok) {
        return processed;
      }
    }
  }
);
