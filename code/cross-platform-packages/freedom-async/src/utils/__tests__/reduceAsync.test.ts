import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { sleep } from 'freedom-testing-tools';

import { reduceAsync } from '../reduceAsync.ts';

describe('reduceAsync', () => {
  it('should work', async (t: TestContext) => {
    const result = await reduceAsync(
      [1, 2, 3, 4, 5],
      async (out, value) => {
        await sleep(Math.random() * 100);
        return out + value;
      },
      0
    );
    t.assert.strictEqual(result, 15);
  });
});
