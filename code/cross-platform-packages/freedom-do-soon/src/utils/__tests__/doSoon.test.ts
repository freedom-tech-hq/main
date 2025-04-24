import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { sleep } from 'freedom-testing-tools';
import { defaultServiceContext, getOrCreateServiceContext } from 'freedom-trace-service-context';

import { doSoon, hasMoreToDoSoon, waitForDoSoons } from '../doSoon.ts';

describe('doSoon', () => {
  it('should work for an existing context', async (t: TestContext) => {
    const serviceContext = defaultServiceContext;

    let callCount = 0;

    const trace = makeTrace('test');
    doSoon(
      trace,
      async (_trace) => {
        await sleep(Math.random() * 100);
        callCount += 1;
      },
      { serviceContext }
    );

    t.assert.strictEqual(callCount, 0);
    t.assert.strictEqual(hasMoreToDoSoon(trace, { serviceContext }), true);

    await waitForDoSoons(trace, { shutdown: false, serviceContext });

    t.assert.strictEqual(callCount, 1);
    t.assert.strictEqual(hasMoreToDoSoon(trace, { serviceContext }), false);
  });

  it('should work with multiple contexts', async (t: TestContext) => {
    const scValue1 = {};
    const scValue2 = {};
    const serviceContext1 = getOrCreateServiceContext(scValue1);
    const serviceContext2 = getOrCreateServiceContext(scValue2);

    let sc1CallCount = 0;
    let sc2CallCount = 0;

    const trace = makeTrace('test');

    doSoon(
      trace,
      async (_trace) => {
        await sleep(100);
        sc1CallCount += 1;
      },
      { serviceContext: serviceContext1 }
    );

    doSoon(
      trace,
      async (_trace) => {
        await sleep(200);
        sc2CallCount += 1;
      },
      { serviceContext: serviceContext2 }
    );

    t.assert.strictEqual(sc1CallCount, 0);
    t.assert.strictEqual(hasMoreToDoSoon(trace, { serviceContext: serviceContext1 }), true);

    t.assert.strictEqual(sc2CallCount, 0);
    t.assert.strictEqual(hasMoreToDoSoon(trace, { serviceContext: serviceContext2 }), true);

    await waitForDoSoons(trace, { shutdown: false, serviceContext: serviceContext1 });

    t.assert.strictEqual(sc1CallCount, 1);
    t.assert.strictEqual(hasMoreToDoSoon(trace, { serviceContext: serviceContext1 }), false);

    t.assert.strictEqual(sc2CallCount, 0);
    t.assert.strictEqual(hasMoreToDoSoon(trace, { serviceContext: serviceContext2 }), true);

    await waitForDoSoons(trace, { shutdown: false, serviceContext: serviceContext2 });

    t.assert.strictEqual(sc2CallCount, 1);
    t.assert.strictEqual(hasMoreToDoSoon(trace, { serviceContext: serviceContext2 }), false);
  });

  it('shutdown should work', async (t: TestContext) => {
    const serviceContext = defaultServiceContext;

    let callCount = 0;

    const trace = makeTrace('test');
    doSoon(
      trace,
      async (_trace) => {
        await sleep(Math.random() * 100);
        callCount += 1;
      },
      { serviceContext }
    );

    t.assert.strictEqual(callCount, 0);
    t.assert.strictEqual(hasMoreToDoSoon(trace, { serviceContext }), true);

    await waitForDoSoons(trace, { shutdown: true, serviceContext });

    t.assert.strictEqual(callCount, 1);
    t.assert.strictEqual(hasMoreToDoSoon(trace, { serviceContext }), false);
  });

  it('waiting on a non-existing context should do nothing', async (t: TestContext) => {
    const serviceContext = defaultServiceContext;

    let callCount = 0;

    const trace = makeTrace('test');
    doSoon(
      trace,
      async (_trace) => {
        await sleep(Math.random() * 100);
        callCount += 1;
      },
      { serviceContext }
    );

    t.assert.strictEqual(callCount, 0);
    t.assert.strictEqual(hasMoreToDoSoon(trace, { serviceContext }), true);

    const wrongServiceContext = getOrCreateServiceContext({});

    t.assert.strictEqual(hasMoreToDoSoon(trace, { serviceContext: wrongServiceContext }), false);

    await waitForDoSoons(trace, { shutdown: false, serviceContext: wrongServiceContext });

    t.assert.strictEqual(callCount, 0);
    t.assert.strictEqual(hasMoreToDoSoon(trace, { serviceContext }), true);
  });

  it('should work with functions that throw', async (t: TestContext) => {
    const serviceContext = defaultServiceContext;

    let callCount = 0;

    const trace = makeTrace('test');
    doSoon(
      trace,
      async (_trace) => {
        await sleep(Math.random() * 100);
        callCount += 1;
        throw new Error('something went wrong');
      },
      { serviceContext }
    );

    t.assert.strictEqual(callCount, 0);
    t.assert.strictEqual(hasMoreToDoSoon(trace, { serviceContext }), true);

    await waitForDoSoons(trace, { shutdown: false, serviceContext });

    t.assert.strictEqual(callCount, 1);
    t.assert.strictEqual(hasMoreToDoSoon(trace, { serviceContext }), false);
  });
});
