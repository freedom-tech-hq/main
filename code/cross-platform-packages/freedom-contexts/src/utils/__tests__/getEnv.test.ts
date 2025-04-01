import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { getEnv, makeEnvDerivative, onEnvChange, setEnv } from '../getEnv.ts';

describe('getEnv', () => {
  it('should work', (t: TestContext) => {
    t.assert.strictEqual(getEnv('SOME_ENV_VALUE', process.env.SOME_ENV_VALUE), undefined);

    const derived = makeEnvDerivative('SOME_ENV_VALUE', 'my-testing-value', (envValue) => (arg: number) => {
      return `hello:${envValue ?? 'nothing'}:${arg + 1}`;
    });

    let calledOnEnvChange = 0;
    onEnvChange('SOME_ENV_VALUE', 'my-testing-value', () => {
      calledOnEnvChange += 1;
    });

    t.assert.strictEqual(calledOnEnvChange, 1);
    t.assert.strictEqual(derived(1), 'hello:nothing:2');

    setEnv('SOME_ENV_VALUE', 'my-testing-value');

    t.assert.strictEqual(calledOnEnvChange, 2);
    t.assert.strictEqual(getEnv('SOME_ENV_VALUE', process.env.SOME_ENV_VALUE), 'my-testing-value');

    t.assert.strictEqual(derived(2), 'hello:my-testing-value:3');
  });
});
