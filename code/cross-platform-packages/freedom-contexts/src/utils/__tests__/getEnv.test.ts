import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { devMakeEnvDerivative, devOnEnvChange, devSetEnv, getEnv } from '../getEnv.ts';

describe('getEnv', () => {
  it('should work', (t: TestContext) => {
    t.assert.strictEqual(getEnv('SOME_ENV_VALUE', process.env.SOME_ENV_VALUE), undefined);

    const derived = devMakeEnvDerivative('SOME_ENV_VALUE', 'my-testing-value', (envValue) => (arg: number) => {
      return `hello:${envValue ?? 'nothing'}:${arg + 1}`;
    });

    let calledOnEnvChange = 0;
    devOnEnvChange('SOME_ENV_VALUE', 'my-testing-value', () => {
      console.trace('CALLED');
      calledOnEnvChange += 1;
    });

    t.assert.strictEqual(calledOnEnvChange, 1);
    t.assert.strictEqual(derived(1), 'hello:my-testing-value:2');

    devSetEnv('SOME_ENV_VALUE', 'my-other-testing-value');

    t.assert.strictEqual(calledOnEnvChange, 2);
    t.assert.strictEqual(getEnv('SOME_ENV_VALUE', process.env.SOME_ENV_VALUE), 'my-other-testing-value');

    t.assert.strictEqual(derived(2), 'hello:my-other-testing-value:3');
  });
});
