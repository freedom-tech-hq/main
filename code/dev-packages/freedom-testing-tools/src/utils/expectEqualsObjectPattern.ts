import assert from 'assert';

import { TestPattern } from '../classes/TestPattern.ts';
import { expectEqualsStructPattern } from './expectEqualsStructPattern.ts';

export const expectEqualsObjectPattern = <T extends Record<string, any>>(value: T, expected: any, msg?: string) => {
  if (expected instanceof TestPattern) {
    const match = expected.evaluate(value);
    return assert.strictEqual(match[0], true, match[1] !== undefined ? `${msg !== undefined ? `${msg}: ` : ''}${match[1]}` : msg);
  }

  assert.strictEqual(expected !== null && typeof expected === 'object', true, `${msg !== undefined ? `${msg}: ` : ''}Expected object`);
  const valueKeys = Object.keys(value).sort();
  const expectedKeys = Object.keys(expected as Record<string, any>).sort();
  assert.deepStrictEqual(
    valueKeys,
    expectedKeys,
    `${msg !== undefined ? `${msg}: ` : ''}Expected keys = ${JSON.stringify(expectedKeys)}, found keys = ${JSON.stringify(valueKeys)}`
  );

  for (const key of valueKeys) {
    expectEqualsStructPattern(
      value[key],
      (expected as Record<string, any>)[key],
      `${msg !== undefined ? `${msg}: ` : ''}Expected items for key ${JSON.stringify(key)} to match`
    );
  }
};
