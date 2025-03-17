import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { sleep } from 'freedom-testing-tools';

import { forOfAsync } from '../forOfAsync.ts';

describe('forOfAsync', () => {
  it('should work synchronously with sync callback', (t: TestContext) => {
    const values: number[] = [];
    forOfAsync([1, 2, 3, 4, 5], (value) => {
      values.push(value);
    });
    t.assert.deepStrictEqual(values, [1, 2, 3, 4, 5]);
  });

  it('should work asynchronously with sync callback', async (t: TestContext) => {
    const values: number[] = [];
    await forOfAsync([1, 2, 3, 4, 5], async (value) => {
      await sleep(Math.random() * 100);
      values.push(value);
    });
    t.assert.deepStrictEqual(values, [1, 2, 3, 4, 5]);
  });

  it('should return first result', async (t: TestContext) => {
    const values: number[] = [];
    const result = await forOfAsync([1, 2, 3, 4, 5], async (value) => {
      await sleep(Math.random() * 100);
      values.push(value);
      if (value === 4) {
        return 'hello';
      }

      return undefined;
    });
    t.assert.deepStrictEqual(values, [1, 2, 3, 4]);
    t.assert.strictEqual(result, 'hello');
  });
});
