import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { genericValueToString } from '../genericValueToString.ts';

describe('genericValueToString', () => {
  it('should work with undefined', (t: TestContext) => {
    t.assert.strictEqual(genericValueToString(undefined), 'undefined');
  });

  it('should work with null', (t: TestContext) => {
    t.assert.strictEqual(genericValueToString(null), 'null');
  });

  it('should work with numbers', (t: TestContext) => {
    t.assert.strictEqual(genericValueToString(3.14), '3.14');
  });

  it('should work with booleans', (t: TestContext) => {
    t.assert.strictEqual(genericValueToString(true), 'true');
  });

  it('should work with strings', (t: TestContext) => {
    t.assert.strictEqual(genericValueToString('hello world'), JSON.stringify('hello world'));
  });

  it('should work with BigInt', (t: TestContext) => {
    t.assert.strictEqual(genericValueToString(BigInt('12321312312312131')), '12321312312312131');
  });

  it('should work with functions', (t: TestContext) => {
    t.assert.strictEqual(
      genericValueToString(() => {}),
      'function'
    );
  });

  it('should work with objects that have toString functions', (t: TestContext) => {
    t.assert.strictEqual(genericValueToString({ toString: () => 'hello world' }), 'hello world');
  });

  it("should work with objects that don't have toString functions", (t: TestContext) => {
    t.assert.strictEqual(genericValueToString({ one: 'hello' }), JSON.stringify({ one: 'hello' }));
  });

  it('should work with self-referential objects', (t: TestContext) => {
    const x: { value: any } = { value: 3.14 };
    x.value = x;

    t.assert.strictEqual(genericValueToString(x), '[object Object]');
  });

  it('should work with class instances that have toString functions', (t: TestContext) => {
    t.assert.strictEqual(genericValueToString(new HelperClass()), 'hello world');
  });
});

class HelperClass {
  toString() {
    return 'hello world';
  }
}
