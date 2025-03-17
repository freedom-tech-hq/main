import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { expectAsyncThrows, sleep } from 'freedom-testing-tools';

import { inline } from '../inline.ts';

describe('inline', () => {
  it('should work with sync functions', (t: TestContext) => {
    const result = inline(() => 3.14);
    t.assert.strictEqual(result, 3.14);
  });

  it('should work with sync functions that throw', (t: TestContext) => {
    t.assert.throws(() =>
      inline(() => {
        throw new Error('something went wrong');
      })
    );
  });

  it('should work with async functions', async (t: TestContext) => {
    const result = await inline(async () => {
      await sleep(Math.random() * 100);
      return 3.14;
    });
    t.assert.strictEqual(result, 3.14);
  });

  it('should work with async functions that throw', async (_t: TestContext) => {
    await expectAsyncThrows(() =>
      inline(async () => {
        await sleep(Math.random() * 100);
        throw new Error('something went wrong');
      })
    );
  });
});
