/* node:coverage disable */

import assert from 'node:assert';

import { get } from 'lodash-es';

import { failureResultLogger } from '../config/failureResultLogger.ts';

export function expectNotOk<T extends { ok: boolean }>(value: T): asserts value is typeof value & { ok: false } {
  if (value.ok !== false) {
    failureResultLogger().error?.('Expected .ok === false, got .ok === true:', get(value, 'value'));
  }
  assert.strictEqual(value.ok, false);
}
