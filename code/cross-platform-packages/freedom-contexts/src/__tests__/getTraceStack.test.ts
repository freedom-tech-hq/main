import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeSubTrace } from '../trace-utils/makeSubTrace.ts';
import { makeTrace } from '../trace-utils/makeTrace.ts';
import { getTraceStack } from '../utils/getTraceStack.ts';

describe('getTraceStack', () => {
  it('getTraceStack should linearly list the IDs of single-level traces', (t: TestContext) => {
    const trace = makeTrace('test', 'hello');
    t.assert.deepStrictEqual(getTraceStack(trace), ['test', 'hello']);
  });

  it('getTraceStack should flatten the list of IDs, from earliest to latest, in multi-level traces', (t: TestContext) => {
    const trace1 = makeTrace('test', 'hello');
    const trace2 = makeSubTrace(trace1, ['a', 'b', 'c']);
    t.assert.deepStrictEqual(getTraceStack(trace2), ['test', 'hello', 'a', 'b', 'c']);
  });
});
