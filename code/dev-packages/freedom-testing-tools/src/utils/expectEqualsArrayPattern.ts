import assert from 'assert';

import { TestPattern } from '../classes/TestPattern.ts';
import { expectEqualsStructPattern } from './expectEqualsStructPattern.ts';

export const expectEqualsArrayPattern = <T>(value: T[], expected: any, msg?: string) => {
  if (expected instanceof TestPattern) {
    const match = expected.evaluate(value);
    return assert.strictEqual(match[0], true, match[1] !== undefined ? `${msg !== undefined ? `${msg}: ` : ''}${match[1]}` : msg);
  }

  assert.strictEqual(Array.isArray(expected), true, `${msg !== undefined ? `${msg}: ` : ''}Expected array`);
  assert.strictEqual(
    value.length,
    (expected as any[]).length,
    `${msg !== undefined ? `${msg}: ` : ''}Expected array with ${(expected as any[]).length} item(s)`
  );

  for (let index = 0; index < value.length; index += 1) {
    expectEqualsStructPattern(
      value[index],
      (expected as any[])[index],
      `${msg !== undefined ? `${msg}: ` : ''}Expected items at index ${index} to match`
    );
  }
};
