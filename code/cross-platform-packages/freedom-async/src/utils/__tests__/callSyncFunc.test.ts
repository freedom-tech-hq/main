import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';

import { callSyncFunc } from '../callSyncFunc.ts';

describe('callSyncFunc', () => {
  it('should work with returned values', (t: TestContext) => {
    const trace = makeTrace('test');
    const result = callSyncFunc(trace, {}, (_trace) => {
      return 3.14;
    });
    t.assert.strictEqual(result, 3.14);
  });

  it('should work with void results', (t: TestContext) => {
    const trace = makeTrace('test');
    let numCalls = 0;
    callSyncFunc(trace, {}, (_trace) => {
      numCalls += 1;
    });
    t.assert.strictEqual(numCalls, 1);
  });

  it('should work with thrown errors', (t: TestContext) => {
    const trace = makeTrace('test');

    t.assert.throws(() =>
      callSyncFunc(trace, {}, (_trace) => {
        throw new Error('something went wrong');
      })
    );
  });
});
