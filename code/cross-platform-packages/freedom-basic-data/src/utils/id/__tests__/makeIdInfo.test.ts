import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeIdInfo } from '../makeIdInfo.ts';

describe('makeIdInfo', () => {
  const testIdInfo = makeIdInfo('TST_');

  describe('id', () => {
    it('should check prefixes', (t: TestContext) => {
      t.assert.strictEqual(testIdInfo.is('TST_one'), true);
      t.assert.strictEqual(testIdInfo.is('TST_'), false);
      t.assert.strictEqual(testIdInfo.is('TEST_two'), false);
    });
  });

  describe('make', () => {
    it('should be prefixed', (t: TestContext) => {
      t.assert.strictEqual(testIdInfo.make('ONE'), 'TST_ONE');
    });
  });

  describe('removePrefix', () => {
    it('should remove prefix', (t: TestContext) => {
      t.assert.strictEqual(testIdInfo.removePrefix('TST_one'), 'one');
    });

    it('should throw if bad data is provided', (t: TestContext) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      t.assert.throws(() => testIdInfo.removePrefix('TEST_one' as any));
    });
  });
});
