import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { expectStrictEqual } from 'freedom-testing-tools';

import { sleep } from '../../utils/sleep.ts';
import { AsyncTransient } from '../AsyncTransient.ts';

describe('AsyncTransient', () => {
  it('should work', async () => {
    const trace = makeTrace('test');

    let callCount = 0;
    const transient = new AsyncTransient(async () => {
      sleep(50);
      callCount += 1;
      return callCount;
    });

    expectStrictEqual(await transient.getValue(trace), 1);
    expectStrictEqual(await transient.getValue(trace), 1);
    transient.markNeedsUpdate();
    expectStrictEqual(await transient.getValue(trace), 2);
  });
});
