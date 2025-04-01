import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makePrefixedUuidInfo } from '../makePrefixedUuidInfo.ts';

describe('makePrefixedUuidInfo', () => {
  const testIdInfo = makePrefixedUuidInfo('TST_');

  describe('is', () => {
    it('should check prefixes', (t: TestContext) => {
      t.assert.strictEqual(testIdInfo.is('TST_one'), false);
      t.assert.strictEqual(testIdInfo.is('TST_'), false);
      t.assert.strictEqual(testIdInfo.is('TEST_two'), false);
      t.assert.strictEqual(testIdInfo.is(`TST_00000000-0000-0000-0000-000000000000`), true);
      t.assert.strictEqual(testIdInfo.is(`TEST_00000000-0000-0000-0000-000000000000`), false);
    });
  });

  describe('make', () => {
    it('should be prefixed', (t: TestContext) => {
      t.assert.strictEqual(testIdInfo.make('00000000-0000-0000-0000-000000000000'), 'TST_00000000-0000-0000-0000-000000000000');
    });
  });

  describe('removePrefix', () => {
    it('should remove prefix', (t: TestContext) => {
      t.assert.strictEqual(testIdInfo.removePrefix('TST_00000000-0000-0000-0000-000000000000'), '00000000-0000-0000-0000-000000000000');
    });

    it('should throw if bad data is provided', (t: TestContext) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      t.assert.throws(() => testIdInfo.removePrefix('TEST_one' as any));
    });
  });
});
