import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { sleep } from 'freedom-testing-tools';
import isPromise from 'is-promise';

import { inline } from '../inline.ts';
import { withResolved } from '../withResolved.ts';

describe('withResolved', () => {
  it('should work with async functions', async (t: TestContext) => {
    const resolved = withResolved(
      inline(async () => {
        await sleep(50);
        return 3.14;
      }),
      (value) => value * 2
    );
    t.assert.strictEqual(isPromise(resolved), true);
    t.assert.strictEqual(await resolved, 6.28);
  });

  it('should work with sync functions', async (t: TestContext) => {
    const resolved = withResolved(
      inline(() => 3.14),
      (value) => value * 2
    );
    t.assert.strictEqual(isPromise(resolved), false);
    t.assert.strictEqual(resolved, 6.28);
  });
});
