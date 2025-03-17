import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { sleep } from 'freedom-testing-tools';

import { forAsync } from '../forAsync.ts';

describe('forAsync', () => {
  it('should work synchronously with sync callback', (t: TestContext) => {
    const indices: number[] = [];
    forAsync(
      0,
      (index) => index < 5,
      1,
      (index) => {
        indices.push(index);
      }
    );
    t.assert.deepStrictEqual(indices, [0, 1, 2, 3, 4]);
  });

  it('should work asynchronously with async callback', async (t: TestContext) => {
    const indices: number[] = [];
    await forAsync(
      0,
      (index) => index < 5,
      1,
      async (index) => {
        await sleep(Math.random() * 100);
        indices.push(index);
      }
    );
    t.assert.deepStrictEqual(indices, [0, 1, 2, 3, 4]);
  });

  it('should return first result', async (t: TestContext) => {
    const indices: number[] = [];
    const result = await forAsync(
      0,
      (index) => index < 5,
      1,
      async (index) => {
        await sleep(Math.random() * 100);
        indices.push(index);

        if (index === 3) {
          return 'hello';
        }

        return undefined;
      }
    );
    t.assert.deepStrictEqual(indices, [0, 1, 2, 3]);
    t.assert.strictEqual(result, 'hello');
  });

  it('should work with dynamic stepper functions', async (t: TestContext) => {
    const indices: number[] = [];
    forAsync(
      0,
      (index) => index < 100,
      (index) => index + indices.length + 1,
      (index) => {
        indices.push(index);
      }
    );
    t.assert.deepStrictEqual(indices, [0, 2, 5, 9, 14, 20, 27, 35, 44, 54, 65, 77, 90]);
  });
});
