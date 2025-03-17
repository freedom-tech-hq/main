import isPromise from 'is-promise';
import type { TypeOrPromisedType } from 'yaschema';

import { inline } from './inline.ts';

/** Like a for loop, handling potentially async callbacks.  Stops and returns the first defined value returned by the specified callback. */
export const forAsync = <ReturnT>(
  initialValue: number,
  shouldContinue: (index: number) => boolean,
  stepper: number | ((index: number) => number),
  callback: (index: number) => TypeOrPromisedType<ReturnT | void>
) => {
  let index = initialValue;

  const step =
    typeof stepper === 'number'
      ? () => {
          index = index + stepper;
        }
      : () => {
          index = stepper(index);
        };

  while (shouldContinue(index)) {
    const result = callback(index);
    if (isPromise(result)) {
      return inline(async () => {
        // If any results are promises, assume they all are

        const resolved = await result;
        /* node:coverage disable */
        if (resolved !== undefined) {
          return resolved;
        }
        /* node:coverage enable */

        step();

        while (shouldContinue(index)) {
          const result = await callback(index);
          if (result !== undefined) {
            return result;
          }

          step();
        }

        return undefined;
      });
    } else {
      /* node:coverage disable */
      if (result !== undefined) {
        return result;
      }
      /* node:coverage enable */

      step();
    }
  }

  return undefined;
};
