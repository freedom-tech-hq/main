import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { objectEntries } from '../objectEntries.ts';
import { objectKeys } from '../objectKeys.ts';
import { objectWithSortedKeys } from '../objectWithSortedKeys.ts';

describe('objectWithSortedKeys', () => {
  it('should work', (t: TestContext) => {
    const obj = objectWithSortedKeys({
      e: 1,
      c: 2,
      a: 3,
      d: 4,
      b: 5,
      f: 6
    });
    t.assert.deepStrictEqual(objectKeys(obj), ['a', 'b', 'c', 'd', 'e', 'f']);
    t.assert.deepStrictEqual(objectEntries(obj), [
      ['a', 3],
      ['b', 5],
      ['c', 2],
      ['d', 4],
      ['e', 1],
      ['f', 6]
    ]);
  });
});
