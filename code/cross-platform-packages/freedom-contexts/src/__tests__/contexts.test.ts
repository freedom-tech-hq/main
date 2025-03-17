import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeSubTrace } from '../trace-utils/makeSubTrace.ts';
import { makeTrace } from '../trace-utils/makeTrace.ts';
import { createTraceContext, useTraceContext } from '../trace-utils/trace-context.ts';
import { getTraceStack } from '../utils/getTraceStack.ts';

const totalAmountContext = createTraceContext(() => 0);

describe('contexts', () => {
  it('default values should work', (t: TestContext) => {
    const trace = makeTrace('test');
    t.assert.strictEqual(useTraceContext(trace, totalAmountContext), 0);
    t.assert.deepStrictEqual(getTraceStack(trace), ['test']);
  });

  it('should work with single level traces', (t: TestContext) => {
    const trace = makeTrace('test');
    totalAmountContext.provider(trace, 3.14, (trace) => {
      t.assert.strictEqual(useTraceContext(trace, totalAmountContext), 3.14);
      t.assert.deepStrictEqual(getTraceStack(trace), ['test']);
    });
  });

  it('should work with multi-level traces without overrides', (t: TestContext) => {
    const trace = makeTrace('test');
    totalAmountContext.provider(trace, 3.14, (trace) => {
      const trace2 = makeSubTrace(trace, ['hello']);
      t.assert.strictEqual(useTraceContext(trace2, totalAmountContext), 3.14);
      t.assert.deepStrictEqual(getTraceStack(trace2), ['test', 'hello']);
    });
  });

  it('should work with multi-level traces with overrides', (t: TestContext) => {
    const trace = makeTrace('test');
    totalAmountContext.provider(trace, 3.14, (trace) => {
      const trace2 = makeSubTrace(trace, ['hello']);
      totalAmountContext.provider(trace2, 6.28, (trace2) => {
        t.assert.strictEqual(useTraceContext(trace2, totalAmountContext), 6.28);
        t.assert.deepStrictEqual(getTraceStack(trace2), ['test', 'hello']);
      });
    });
  });
});
