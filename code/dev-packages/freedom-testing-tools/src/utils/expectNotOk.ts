/* node:coverage disable */

import assert from 'node:assert';

import { get } from 'lodash-es';

import { genericValueToString } from '../internal/utils/genericValueToString.ts';

export function expectNotOk<T extends { ok: boolean }>(value: T): asserts value is typeof value & { ok: false } {
  assert.strictEqual(value.ok, false, `Expected .ok === false, got .ok === true: ${genericValueToString(get(value, 'value'))}`);
}
