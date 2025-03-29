import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { expectDurationAtLeastMSec, expectDurationLessThanMSec, expectOk, sleep } from 'freedom-testing-tools';

import { makeAsyncResultFunc } from '../../utils/makeAsyncResultFunc.ts';
import { Pool } from '../Pool.ts';
import type { PR } from '../PR.ts';
import { makeSuccess } from '../Result.ts';

describe('Pool', () => {
  it('getting should work', async (t: TestContext) => {
    let value = 0;
    const pool = new Pool(
      [],
      2,
      makeAsyncResultFunc([import.meta.filename], async (_trace): PR<number> => {
        await sleep(100);

        value += 1;
        return makeSuccess(value);
      })
    );

    await sleep(300);

    const got1 = await expectDurationLessThanMSec(50, async () => await pool.get());
    expectOk(got1);
    t.assert.strictEqual(got1.value, 1);

    const got2 = await expectDurationLessThanMSec(50, async () => await pool.get());
    expectOk(got2);
    t.assert.strictEqual(got2.value, 2);

    const got3 = await expectDurationAtLeastMSec(50, async () => await pool.get());
    expectOk(got3);
    t.assert.strictEqual(got3.value, 3);

    await sleep(300);
  });

  it('putBack should work', async (t: TestContext) => {
    let value = 0;
    const pool = new Pool(
      [],
      2,
      makeAsyncResultFunc([import.meta.filename], async (_trace): PR<number> => {
        await sleep(100);

        value += 1;
        return makeSuccess(value);
      })
    );

    await sleep(300);

    const got1 = await expectDurationLessThanMSec(50, async () => await pool.get());
    expectOk(got1);
    t.assert.strictEqual(got1.value, 1);

    const got2 = await expectDurationLessThanMSec(50, async () => await pool.get());
    expectOk(got2);
    t.assert.strictEqual(got2.value, 2);

    pool.putBack(got1.value);
    pool.putBack(got2.value);

    const got3 = await expectDurationLessThanMSec(50, async () => await pool.get());
    expectOk(got3);
    t.assert.strictEqual(got3.value, 2);

    await sleep(300);
  });
});
