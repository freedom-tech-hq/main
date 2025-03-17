import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { sleep } from 'freedom-testing-tools';
import { defaultServiceContext, makeServiceContext } from 'freedom-trace-service-context';

import { doSoon, hasMoreToDoSoon, waitForDoSoons } from '../doSoon.ts';

describe('doSoon', () => {
  const serviceContext = defaultServiceContext;

  it('should work for an existing context', async (t: TestContext) => {
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
    t.assert.strictEqual(hasMoreToDoSoon({ serviceContext }), true);

    await waitForDoSoons({ shutdown: false, serviceContext });

    t.assert.strictEqual(callCount, 1);
    t.assert.strictEqual(hasMoreToDoSoon({ serviceContext }), false);
  });

  it('shutdown should work', async (t: TestContext) => {
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
    t.assert.strictEqual(hasMoreToDoSoon({ serviceContext }), true);

    await waitForDoSoons({ shutdown: true, serviceContext });

    t.assert.strictEqual(callCount, 1);
    t.assert.strictEqual(hasMoreToDoSoon({ serviceContext }), false);
  });

  it('waiting on a non-existing context should do nothing', async (t: TestContext) => {
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
    t.assert.strictEqual(hasMoreToDoSoon({ serviceContext }), true);

    const wrongServiceContext = makeServiceContext({});

    t.assert.strictEqual(hasMoreToDoSoon({ serviceContext: wrongServiceContext }), false);

    await waitForDoSoons({ shutdown: false, serviceContext: wrongServiceContext });

    t.assert.strictEqual(callCount, 0);
    t.assert.strictEqual(hasMoreToDoSoon({ serviceContext }), true);
  });

  it('should work with functions that throw', async (t: TestContext) => {
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
    t.assert.strictEqual(hasMoreToDoSoon({ serviceContext }), true);

    await waitForDoSoons({ shutdown: false, serviceContext });

    t.assert.strictEqual(callCount, 1);
    t.assert.strictEqual(hasMoreToDoSoon({ serviceContext }), false);
  });
});
