import type { TFunction } from 'i18next';

import type { PFunction } from '../types/PFunction.ts';

export const makeDefaultPFunction = (t: TFunction | void): PFunction => {
  const output = ((count: number) => {
    if (count === 0) {
      return 'zero';
    } else if (count === 1) {
      return 'one';
    } else if (count === 2) {
      return 'two';
    } else {
      return 'other';
    }
  }) as Partial<PFunction>;

  output.t = t;

  return output as PFunction;
};
