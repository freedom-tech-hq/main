import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { schema } from 'yaschema';
import * as Y from 'yjs';

import { makeConflictFreeArrayFieldFromYArray } from '../makeConflictFreeArrayFieldFromYArray.ts';
import { makeConflictFreeDocumentFieldInfos } from '../makeConflictFreeDocumentFieldInfos.ts';

const itemSchema = schema.oneOf(schema.string(), schema.number());

describe('makeConflictFreeArrayFieldFromYArray', () => {
  describe('append', () => {
    it('appending onto an empty array should work', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      cfArray.append(['hello', 3.14]);
      t.assert.strictEqual(cfArray.getLength(), 2);
      t.assert.strictEqual(cfArray.get(0), 'hello');
      t.assert.strictEqual(cfArray.get(1), 3.14);
    });

    it('appending onto a non-empty array should work', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      cfArray.append(['hello', 3.14]);
      cfArray.append(['one', 1]);
      t.assert.strictEqual(cfArray.getLength(), 4);
      t.assert.strictEqual(cfArray.get(0), 'hello');
      t.assert.strictEqual(cfArray.get(1), 3.14);
      t.assert.strictEqual(cfArray.get(2), 'one');
      t.assert.strictEqual(cfArray.get(3), 1);
    });
  });

  describe('clear', () => {
    it('clearing an empty array should work', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      t.assert.strictEqual(cfArray.getLength(), 0);

      cfArray.clear();
      t.assert.strictEqual(cfArray.getLength(), 0);
    });

    it('clearing a non-empty array should work', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      cfArray.insert(0, ['hello', 3.14]);
      t.assert.strictEqual(cfArray.getLength(), 2);

      cfArray.clear();
      t.assert.strictEqual(cfArray.getLength(), 0);
    });
  });

  describe('findIndex', () => {
    it('should return a value < 0 when called on an empty list', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);

      const index = cfArray.findIndex((item) => item === 'one');
      t.assert.strictEqual(index < 0, true);
    });

    it('should return a value < 0 when no matching value is found', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      cfArray.append(['hello', 3.14, 'one', 1]);

      const index = cfArray.findIndex((item) => item === 'goodbye');
      t.assert.strictEqual(index < 0, true);
    });

    it('should return a value >= 0 when a match is found', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      cfArray.append(['hello', 3.14, 'one', 1]);

      const index = cfArray.findIndex((item) => item === 'one');
      t.assert.strictEqual(index, 2);
    });
  });

  describe('get', () => {
    it('getting a negative index should return undefined', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      cfArray.append(['hello', 3.14, 'one', 1]);

      const value = cfArray.get(-1);
      t.assert.strictEqual(value, undefined);
    });

    it('getting a non-existent index should return undefined', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      cfArray.append(['hello', 3.14, 'one', 1]);

      const value = cfArray.get(99);
      t.assert.strictEqual(value, undefined);
    });
  });

  describe('insert', () => {
    it('inserting into an empty array should work', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      cfArray.insert(0, ['hello', 3.14]);
      t.assert.strictEqual(cfArray.getLength(), 2);
      t.assert.strictEqual(cfArray.get(0), 'hello');
      t.assert.strictEqual(cfArray.get(1), 3.14);
    });

    it('inserting at the beginning of an array should work', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      cfArray.insert(0, ['hello', 3.14]);
      cfArray.insert(0, ['one', 1]);
      t.assert.strictEqual(cfArray.getLength(), 4);
      t.assert.strictEqual(cfArray.get(0), 'one');
      t.assert.strictEqual(cfArray.get(1), 1);
      t.assert.strictEqual(cfArray.get(2), 'hello');
      t.assert.strictEqual(cfArray.get(3), 3.14);
    });

    it('inserting at the end of an array should work', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      cfArray.insert(0, ['hello', 3.14]);
      cfArray.insert(cfArray.getLength(), ['one', 1]);
      t.assert.strictEqual(cfArray.getLength(), 4);
      t.assert.strictEqual(cfArray.get(0), 'hello');
      t.assert.strictEqual(cfArray.get(1), 3.14);
      t.assert.strictEqual(cfArray.get(2), 'one');
      t.assert.strictEqual(cfArray.get(3), 1);
    });

    it('inserting into the middle an array should work', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      cfArray.insert(0, ['hello', 3.14]);
      cfArray.insert(1, ['one', 1]);
      t.assert.strictEqual(cfArray.getLength(), 4);
      t.assert.strictEqual(cfArray.get(0), 'hello');
      t.assert.strictEqual(cfArray.get(1), 'one');
      t.assert.strictEqual(cfArray.get(2), 1);
      t.assert.strictEqual(cfArray.get(3), 3.14);
    });
  });

  describe('entries', () => {
    it('should work with default range and order', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      cfArray.insert(0, ['hello', 3.14, 'one', 1]);

      t.assert.deepStrictEqual(Array.from(cfArray.entries()), [
        [0, 'hello'],
        [1, 3.14],
        [2, 'one'],
        [3, 1]
      ]);
    });

    it('should work with default range and reverse order', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      cfArray.insert(0, ['hello', 3.14, 'one', 1]);

      t.assert.deepStrictEqual(Array.from(cfArray.entries(undefined, true)), [
        [3, 1],
        [2, 'one'],
        [1, 3.14],
        [0, 'hello']
      ]);
    });

    it('should work with number range and default order', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      cfArray.insert(0, ['hello', 3.14, 'one', 1]);

      t.assert.deepStrictEqual(Array.from(cfArray.entries(2)), [
        [2, 'one'],
        [3, 1]
      ]);
    });

    it('should work with number range and reverse order', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      cfArray.insert(0, ['hello', 3.14, 'one', 1]);

      t.assert.deepStrictEqual(Array.from(cfArray.entries(2, true)), [
        [3, 1],
        [2, 'one']
      ]);
    });

    it('should work with tuple range and default order', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      cfArray.insert(0, ['hello', 3.14, 'one', 1]);

      t.assert.deepStrictEqual(Array.from(cfArray.entries([1, 3])), [
        [1, 3.14],
        [2, 'one']
      ]);
    });

    it('should work with tuple range and reverse order', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      cfArray.insert(0, ['hello', 3.14, 'one', 1]);

      t.assert.deepStrictEqual(Array.from(cfArray.entries([1, 3], true)), [
        [2, 'one'],
        [1, 3.14]
      ]);
    });
  });

  describe('delete', () => {
    it('deleting at the beginning of an array should work', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      cfArray.insert(0, ['hello', 3.14]);
      cfArray.delete(0, 1);
      t.assert.strictEqual(cfArray.getLength(), 1);
      t.assert.strictEqual(cfArray.get(0), 3.14);
    });

    it('deleting at the end of an array should work', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      cfArray.insert(0, ['hello', 3.14]);
      cfArray.delete(cfArray.getLength() - 1);
      t.assert.strictEqual(cfArray.getLength(), 1);
      t.assert.strictEqual(cfArray.get(0), 'hello');
    });

    it('deleting from the middle an array should work', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      cfArray.insert(0, ['hello', 3.14, 'one', 1]);
      cfArray.delete(1, 3);
      t.assert.strictEqual(cfArray.getLength(), 2);
      t.assert.strictEqual(cfArray.get(0), 'hello');
      t.assert.strictEqual(cfArray.get(1), 1);
    });

    it('deleting all items from an array should work', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      cfArray.insert(0, ['hello', 3.14, 'one', 1]);
      cfArray.delete(0, cfArray.getLength());
      t.assert.strictEqual(cfArray.getLength(), 0);
    });
  });

  describe('slice', () => {
    it('should work', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      cfArray.insert(0, ['hello', 3.14, 'one', 1]);
      const theSlice = cfArray.slice(2);
      t.assert.strictEqual(cfArray.getLength(), 4);
      t.assert.deepStrictEqual(theSlice, ['one', 1]);
    });
  });

  describe('splice', () => {
    it('should work on an empty list', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      cfArray.splice(0, 0, ['hello', 3.14]);
      t.assert.strictEqual(cfArray.getLength(), 2);
      t.assert.strictEqual(cfArray.get(0), 'hello');
      t.assert.strictEqual(cfArray.get(1), 3.14);
    });

    it('should work on a non-empty list without deleting', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      cfArray.append(['hello', 3.14]);
      cfArray.splice(1, 0, ['one', 1]);
      t.assert.strictEqual(cfArray.getLength(), 4);
      t.assert.strictEqual(cfArray.get(0), 'hello');
      t.assert.strictEqual(cfArray.get(1), 'one');
      t.assert.strictEqual(cfArray.get(2), 1);
      t.assert.strictEqual(cfArray.get(3), 3.14);
    });

    it('should work on a non-empty list with deleting', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      cfArray.append(['hello', 3.14]);
      cfArray.splice(1, 1, ['one', 1]);
      t.assert.strictEqual(cfArray.getLength(), 3);
      t.assert.strictEqual(cfArray.get(0), 'hello');
      t.assert.strictEqual(cfArray.get(1), 'one');
      t.assert.strictEqual(cfArray.get(2), 1);
    });

    it('should work on a non-empty list with deleting and without new items', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      cfArray.append(['hello', 3.14]);
      cfArray.splice(1, 1, []);
      t.assert.strictEqual(cfArray.getLength(), 1);
      t.assert.strictEqual(cfArray.get(0), 'hello');
    });
  });

  describe('values', () => {
    it('should work with default range and order', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      cfArray.insert(0, ['hello', 3.14, 'one', 1]);

      t.assert.deepStrictEqual(Array.from(cfArray.values()), ['hello', 3.14, 'one', 1]);
    });

    it('should work with default range and reverse order', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      cfArray.insert(0, ['hello', 3.14, 'one', 1]);

      t.assert.deepStrictEqual(Array.from(cfArray.values(undefined, true)), [1, 'one', 3.14, 'hello']);
    });

    it('should work with number range and default order', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      cfArray.insert(0, ['hello', 3.14, 'one', 1]);

      t.assert.deepStrictEqual(Array.from(cfArray.values(2)), ['one', 1]);
    });

    it('should work with number range and reverse order', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      cfArray.insert(0, ['hello', 3.14, 'one', 1]);

      t.assert.deepStrictEqual(Array.from(cfArray.values(2, true)), [1, 'one']);
    });

    it('should work with tuple range and default order', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      cfArray.insert(0, ['hello', 3.14, 'one', 1]);

      t.assert.deepStrictEqual(Array.from(cfArray.values([1, 3])), [3.14, 'one']);
    });

    it('should work with tuple range and reverse order', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      cfArray.insert(0, ['hello', 3.14, 'one', 1]);

      t.assert.deepStrictEqual(Array.from(cfArray.values([1, 3], true)), ['one', 3.14]);
    });
  });
});
