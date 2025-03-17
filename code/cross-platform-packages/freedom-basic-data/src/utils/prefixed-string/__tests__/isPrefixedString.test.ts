import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { isPrefixedString } from '../isPrefixedString.ts';

describe('isPrefixedString', () => {
  it('should return true for a valid prefixed string', (t: TestContext) => {
    const result = isPrefixedString('prefix_', 'prefix_value', {
      allowEmpty: false,
      isNonPrefixedValueValid: () => true
    });
    t.assert.strictEqual(result, true);
  });

  it('should return false for a string without the prefix', (t: TestContext) => {
    const result = isPrefixedString('prefix_', 'value', {
      allowEmpty: false,
      isNonPrefixedValueValid: () => true
    });
    t.assert.strictEqual(result, false);
  });

  it('should return false for an empty string when allowEmpty is false', (t: TestContext) => {
    const result = isPrefixedString('prefix_', 'prefix_', {
      allowEmpty: false,
      isNonPrefixedValueValid: () => true
    });
    t.assert.strictEqual(result, false);
  });

  it('should return true for an empty string when allowEmpty is true', (t: TestContext) => {
    const result = isPrefixedString('prefix_', 'prefix_', {
      allowEmpty: true,
      isNonPrefixedValueValid: () => true
    });
    t.assert.strictEqual(result, true);
  });

  it('should return false if isNonPrefixedValueValid returns false', (t: TestContext) => {
    const result = isPrefixedString('prefix_', 'prefix_invalid', {
      allowEmpty: false,
      isNonPrefixedValueValid: (nonPrefixedValue) => nonPrefixedValue === 'valid'
    });
    t.assert.strictEqual(result, false);
  });
});
