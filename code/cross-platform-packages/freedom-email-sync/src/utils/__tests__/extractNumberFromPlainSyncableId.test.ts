import { describe, it } from 'node:test';

import { plainId } from 'freedom-sync-types';
import { expectStrictEqual } from 'freedom-testing-tools';

import { extractNumberFromPlainSyncableId } from '../../../utils/extractNumberFromPlainSyncableId.ts';

describe('extractNumberFromPlainSyncableId', () => {
  it('should work', () => {
    expectStrictEqual(extractNumberFromPlainSyncableId(plainId('bundle', '2025')), 2025);
  });
});
