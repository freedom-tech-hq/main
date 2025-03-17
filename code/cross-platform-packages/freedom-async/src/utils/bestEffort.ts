import type { Trace } from 'freedom-contexts';

import { log } from '../config/logging.ts';
import type { PR } from '../types/PR.ts';
import type { PRFunc } from '../types/PRFunc.ts';
import { callAsyncResultFunc } from './callAsyncResultFunc.ts';
import { makeAsyncFunc } from './makeAsyncFunc.ts';

export const bestEffort = makeAsyncFunc(
  [import.meta.filename],
  async <SuccessT, ErrorCodeT extends string = never>(
    trace: Trace,
    result: PR<SuccessT, ErrorCodeT> | PRFunc<SuccessT, ErrorCodeT>
  ): Promise<SuccessT | undefined> => {
    try {
      const res = await (typeof result === 'function' ? callAsyncResultFunc(trace, {}, result) : result);
      if (!res.ok) {
        log().warn?.(trace, 'An error occurred in a best effort evaluator', res.value);
        return undefined;
      }

      return res.value;
    } catch (e) {
      /* node:coverage disable */
      log().warn?.(trace, 'An error occurred in a best effort evaluator', e);
      return undefined;
      /* node:coverage enable */
    }
  }
);
