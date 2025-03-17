/* node:coverage disable */

import assert from 'node:assert';

import { get } from 'lodash-es';

import { expectNotOk } from './expectNotOk.ts';

export function expectErrorCode<T extends { ok: boolean }>(value: T, errorCode: string): asserts value is typeof value & { ok: false } {
  expectNotOk(value);
  assert.strictEqual(get(value, 'value.errorCode'), errorCode);
}
