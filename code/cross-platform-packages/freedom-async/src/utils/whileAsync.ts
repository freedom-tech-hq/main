import isPromise from 'is-promise';
import type { TypeOrPromisedType } from 'yaschema';

import { inline } from './inline.ts';

/** Like a while loop, handling potentially async callbacks.  Stops and returns the first defined value returned by the specified
 * callback. */
export const whileAsync = <ReturnT>(shouldContinue: () => boolean, callback: () => TypeOrPromisedType<ReturnT | void>) => {
  while (shouldContinue()) {
    const result = callback();
    if (isPromise(result)) {
      return inline(async () => {
        // If any results are promises, assume they all are

        const resolved = await result;
        /* node:coverage disable */
        if (resolved !== undefined) {
          return resolved;
        }
        /* node:coverage enable */

        while (shouldContinue()) {
          const result = await callback();
          if (result !== undefined) {
            return result;
          }
        }

        return undefined;
      });
    } else {
      /* node:coverage disable */
      if (result !== undefined) {
        return result;
      }
      /* node:coverage enable */
    }
  }

  return undefined;
};
