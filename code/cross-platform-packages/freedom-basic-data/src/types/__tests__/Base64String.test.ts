import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { base64String } from '../Base64String.ts';

describe('Base64String', () => {
  describe('makeWithUtf8String should encode utf-8 strings to base-64 and add a "B64_" prefix', () => {
    it('should work with empty strings', (t: TestContext) => {
      const originalString = '';

      const encoded = base64String.makeWithUtf8String(originalString);
      t.assert.strictEqual(encoded.startsWith(base64String.prefix), true);
      t.assert.strictEqual(base64String.is(encoded), true);

      const nonPrefixedValue = base64String.removePrefix(encoded);

      const decoded = Buffer.from(nonPrefixedValue, 'base64').toString('utf-8');
      t.assert.strictEqual(decoded, originalString);
    });

    it('should work with non-empty strings', (t: TestContext) => {
      const originalString = 'Hello World';

      const encoded = base64String.makeWithUtf8String(originalString);
      t.assert.strictEqual(encoded.startsWith(base64String.prefix), true);
      t.assert.strictEqual(base64String.is(encoded), true);

      const nonPrefixedValue = base64String.removePrefix(encoded);
      t.assert.notStrictEqual(nonPrefixedValue, originalString);

      const decoded = Buffer.from(nonPrefixedValue, 'base64').toString('utf-8');
      t.assert.strictEqual(decoded, originalString);
    });
  });

  it('makeWithNonPrefixBase64String should add a "B64_" prefix to an already base-64-encoded string', (t: TestContext) => {
    const originalString = 'Hello World';

    const preEncoded = Buffer.from(originalString, 'utf-8').toString('base64');
    const encoded = base64String.makeWithNonPrefixBase64String(preEncoded);
    t.assert.strictEqual(encoded.startsWith(base64String.prefix), true);
    t.assert.strictEqual(base64String.is(encoded), true);

    const nonPrefixedValue = base64String.removePrefix(encoded);
    t.assert.notStrictEqual(nonPrefixedValue, originalString);
    t.assert.strictEqual(nonPrefixedValue, preEncoded);

    const decoded = Buffer.from(nonPrefixedValue, 'base64').toString('utf-8');
    t.assert.strictEqual(decoded, originalString);
  });

  it('makeWithBuffer should encode the buffer into base-64 and add a "B64_" prefix', (t: TestContext) => {
    const originalString = 'Hello World';

    const buffer = Buffer.from(originalString, 'utf-8');
    const encoded = base64String.makeWithBuffer(buffer);
    t.assert.strictEqual(encoded.startsWith(base64String.prefix), true);
    t.assert.strictEqual(base64String.is(encoded), true);

    const nonPrefixedValue = base64String.removePrefix(encoded);
    t.assert.notStrictEqual(nonPrefixedValue, originalString);

    const decoded = Buffer.from(nonPrefixedValue, 'base64').toString('utf-8');
    t.assert.strictEqual(decoded, originalString);
  });

  it('toBuffer should work', (t: TestContext) => {
    const originalString = 'Hello World';

    const encoded = base64String.makeWithUtf8String(originalString);
    const buffer = base64String.toBuffer(encoded);

    const manualBuffer = Buffer.from(originalString, 'utf-8');
    t.assert.strictEqual(buffer.length, manualBuffer.length);
  });

  it('toUtf8String should work', (t: TestContext) => {
    const originalString = 'Hello World';

    const encoded = base64String.makeWithUtf8String(originalString);
    t.assert.strictEqual(base64String.toUtf8String(encoded), originalString);
  });
});
