/* node:coverage disable */

import assert from 'node:assert';

import { get } from 'lodash-es';

import { genericValueToString } from '../internal/utils/genericValueToString.ts';

export function expectOk<T extends { ok: boolean }>(value: T): asserts value is typeof value & { ok: true } {
  assert.strictEqual(value.ok, true, `Expected .ok === true, got .ok === false: ${genericValueToString(get(value, 'value'))}`);
}
