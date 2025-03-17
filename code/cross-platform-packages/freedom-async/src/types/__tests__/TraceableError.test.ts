import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';

import { GeneralError } from '../GeneralError.ts';

describe('TraceableError', () => {
  it('Calling toString twice on the same error should result in an "already logged error …" string', (t: TestContext) => {
    const trace = makeTrace('test');
    const error = new GeneralError(trace, new Error('something went wrong'), 'one');

    const str1 = error.toString();
    t.assert.strictEqual(str1.startsWith('new error '), true);

    const str2 = error.toString();
    t.assert.strictEqual(str2.startsWith('already logged error '), true);
  });

  it('Calling toString twice on the same error, if allowAlreadyLogged is true, should not result in an "already logged error …" string', (t: TestContext) => {
    const trace = makeTrace('test');
    const error = new GeneralError(trace, new Error('something went wrong'), 'one');

    const str1 = error.toString();
    t.assert.strictEqual(str1.startsWith('new error '), true);

    const str2 = error.toString(true);
    t.assert.strictEqual(str2.startsWith('new error '), true);
  });
});
