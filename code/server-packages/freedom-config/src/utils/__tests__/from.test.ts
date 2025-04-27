import assert from 'node:assert';
import { describe, it } from 'node:test';

import { from } from '../from.ts';

describe('from', () => {
  const env = { THE_VAR: 'value:123' };

  it('should implement custom validator', () => {
    // Act
    const envValue = from(env)
      .get('THE_VAR')
      .asCustom((value: string) => {
        const [key, val] = value.split(':');
        return { key, value: Number(val) };
      });

    // Assert
    assert.deepStrictEqual(envValue, { key: 'value', value: 123 });
  });

  it('should throw error when custom validator fails', () => {
    assert.throws(
      // Act
      () =>
        from(env)
          .get('THE_VAR')
          .asCustom(() => {
            throw new Error('The error message');
          }),
      // Assert
      { message: 'env-var: "THE_VAR" The error message' }
    );
  });
});
