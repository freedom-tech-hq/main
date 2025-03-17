import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { tokenize } from '../tokenize.ts';

describe('tokenize', () => {
  it('should work', (t: TestContext) => {
    t.assert.deepStrictEqual(tokenize('hello-world*foo**bar', /-|\*{1,2}/), [
      { isToken: false, value: 'hello' },
      { isToken: true, value: '-' },
      { isToken: false, value: 'world' },
      { isToken: true, value: '*' },
      { isToken: false, value: 'foo' },
      { isToken: true, value: '**' },
      { isToken: false, value: 'bar' }
    ]);
  });
});
