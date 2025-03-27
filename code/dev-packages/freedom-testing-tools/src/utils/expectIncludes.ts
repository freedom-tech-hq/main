/* node:coverage disable */

import assert from 'node:assert';

import { isEqual } from 'lodash-es';

export function expectIncludes(value: any[], expectedItem: any, areItemsEqual = isEqual) {
  assert.strictEqual(value.find((item) => areItemsEqual(item, expectedItem)) !== undefined, true);
}
