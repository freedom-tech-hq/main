import assert from 'node:assert';

import { TestPattern } from '../classes/TestPattern.ts';
import { expectEqualsArrayPattern } from './expectEqualsArrayPattern.ts';
import { expectEqualsObjectPattern } from './expectEqualsObjectPattern.ts';

export const expectEqualsStructPattern = <T>(value: T, expected: any, msg?: string) => {
  if (expected instanceof TestPattern) {
    const match = expected.evaluate(value);
    return assert.strictEqual(match[0], true, match[1] !== undefined ? `${msg !== undefined ? `${msg}: ` : ''}${match[1]}` : msg);
  }

  if (Array.isArray(value)) {
    return expectEqualsArrayPattern(value, expected, msg);
  } else if (value !== null && typeof value === 'object') {
    return expectEqualsObjectPattern(value, expected, msg);
  } else {
    assert.strictEqual(value, expected, msg);
  }
};
