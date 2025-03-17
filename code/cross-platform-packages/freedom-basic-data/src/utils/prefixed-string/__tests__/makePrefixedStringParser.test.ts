import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makePrefixedStringParser } from '../makePrefixedStringParser.ts';

describe('makePrefixedStringParser', () => {
  it('should work without offsets', (t: TestContext) => {
    const parse = makePrefixedStringParser('hello_');

    const originalString = 'hello_world';
    const parsed = parse(originalString);
    t.assert.notStrictEqual(parsed, undefined);
    t.assert.strictEqual(parsed!.numUsedChars, originalString.length);
    t.assert.strictEqual(parsed!.value, originalString);
  });

  it('should work with offsets', (t: TestContext) => {
    const parse = makePrefixedStringParser('hello_');

    const originalString = 'goodbye_there,hello_world';
    const parsed = parse(originalString, 14);
    t.assert.notStrictEqual(parsed, undefined);
    t.assert.strictEqual(parsed!.numUsedChars, 11);
    t.assert.strictEqual(parsed!.value, 'hello_world');
  });
});
