import isPromise from 'is-promise';
import type { TypeOrPromisedType } from 'yaschema';

import { inline } from './inline.ts';

/** Like a for…of loop, handling potentially async callbacks.  Stops and returns the first defined value returned by the specified callback. */
export const forOfAsync = <T, ReturnT>(items: T[], callback: (item: T) => TypeOrPromisedType<ReturnT | void>) => {
  let index = 0;

  const numItems = items.length;
  while (index < numItems) {
    const result = callback(items[index]);
    if (isPromise(result)) {
      return inline(async () => {
        // If any results are promises, assume they all are

        const resolved = await result;
        /* node:coverage disable */
        if (resolved !== undefined) {
          return resolved;
        }
        /* node:coverage enable */

        index += 1;

        while (index < numItems) {
          const result = await callback(items[index]);
          if (result !== undefined) {
            return result;
          }

          index += 1;
        }

        return undefined;
      });
    } else {
      /* node:coverage disable */
      if (result !== undefined) {
        return result;
      }
      /* node:coverage enable */

      index += 1;
    }
  }

  return undefined;
};
