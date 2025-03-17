import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { sleep } from 'freedom-async';

import { doPeriodic } from '../doPeriodic.ts';

describe('doPeriodic', () => {
  it('should work with leading edge', async (t: TestContext) => {
    let callCount = 0;
    const cancel = doPeriodic(
      async () => {
        callCount += 1;
      },
      { intervalMSec: 50, edge: 'leading' }
    );

    t.assert.strictEqual(callCount, 0);

    await sleep(0);
    t.assert.strictEqual(callCount, 1);

    await sleep(50);
    t.assert.strictEqual(callCount, 2);

    await sleep(50);
    t.assert.strictEqual(callCount, 3);

    cancel();

    await sleep(50);
    t.assert.strictEqual(callCount, 3);
  });

  it('should work with trailing edge', async (t: TestContext) => {
    let callCount = 0;
    const cancel = doPeriodic(
      async () => {
        callCount += 1;
      },
      { intervalMSec: 50, edge: 'trailing' }
    );

    t.assert.strictEqual(callCount, 0);

    await sleep(0);
    t.assert.strictEqual(callCount, 0);

    await sleep(50);
    t.assert.strictEqual(callCount, 1);

    await sleep(50);
    t.assert.strictEqual(callCount, 2);

    cancel();

    await sleep(50);
    t.assert.strictEqual(callCount, 2);
  });
});
