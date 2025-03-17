import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { sleep } from 'freedom-testing-tools';

import { whileAsync } from '../whileAsync.ts';

describe('whileAsync', () => {
  it('should work synchronously for sync callback', (t: TestContext) => {
    const values: number[] = [];
    let i = 0;
    whileAsync(
      () => i < 5,
      () => {
        values.push(i);
        i += 1;
      }
    );
    t.assert.deepStrictEqual(values, [0, 1, 2, 3, 4]);
  });

  it('should work asynchronously for async callback', async (t: TestContext) => {
    const values: number[] = [];
    let i = 0;
    await whileAsync(
      () => i < 5,
      async () => {
        await sleep(Math.random() * 100);
        values.push(i);
        i += 1;
      }
    );
    t.assert.deepStrictEqual(values, [0, 1, 2, 3, 4]);
  });

  it('should return first result', async (t: TestContext) => {
    const values: number[] = [];
    let i = 0;
    const result = await whileAsync(
      () => i < 5,
      async () => {
        await sleep(Math.random() * 100);
        values.push(i);
        i += 1;

        if (i === 3) {
          return 'hello';
        }

        return undefined;
      }
    );
    t.assert.deepStrictEqual(values, [0, 1, 2]);
    t.assert.strictEqual(result, 'hello');
  });
});
