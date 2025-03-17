import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeSubTrace } from '../trace-utils/makeSubTrace.ts';
import { makeTrace } from '../trace-utils/makeTrace.ts';
import { attachToTrace } from '../utils/attachToTrace.ts';
import { traceToString } from '../utils/traceToString.ts';

describe('traceToString', () => {
  it('traceToString should include a trace ID and then linearly list the IDs of single-level traces', (t: TestContext) => {
    const trace = makeTrace('test', 'hello');
    t.assert.match(traceToString(trace), /traceId=[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12} stack=test>hello/);
  });

  it('traceToString should include a trace ID and then flatten the list of IDs, from earliest to latest, in multi-level traces', (t: TestContext) => {
    const trace1 = makeTrace('test', 'hello');
    const trace2 = makeSubTrace(trace1, ['a', 'b', 'c']);
    t.assert.match(traceToString(trace2), /traceId=[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12} stack=test>hello>a>b>c/);
  });

  it('traceToString should include JSON stingified attachments at the end of each level', (t: TestContext) => {
    const trace1 = makeTrace('test', 'hello');
    attachToTrace(trace1, { username: 'testing' });
    const trace2 = makeSubTrace(trace1, ['a', 'b', 'c']);
    attachToTrace(trace2, { total: 3.14 });
    t.assert.match(
      traceToString(trace2),
      /traceId=[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12} stack=test>hello>\{"username":"testing"\}>a>b>c>\{"total":3\.14\}/
    );
  });
});
