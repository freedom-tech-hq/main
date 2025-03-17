import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makePrefixedStringInfo } from '../makePrefixedStringInfo.ts';

describe('makePrefixedStringInfo', () => {
  describe('removePrefix', () => {
    it('should return the value without the prefix for a valid prefixed value', (t: TestContext) => {
      const prefixedStringInfo = makePrefixedStringInfo('prefix_', { allowEmpty: false, isNonPrefixedValueValid: () => true });
      t.assert.strictEqual(prefixedStringInfo.removePrefix('prefix_value'), 'value');
    });
  });
});
