/* node:coverage disable */

import assert from 'node:assert';

import { get } from 'lodash-es';

import { failureResultLogger } from '../config/failureResultLogger.ts';

export function expectOk<T extends { ok: boolean }>(value: T): asserts value is typeof value & { ok: true } {
  if (value.ok !== true) {
    failureResultLogger().error?.('Expected .ok === true, got .ok === false:', get(value, 'value'));
  }
  assert.strictEqual(value.ok, true);
}
