import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { schema } from 'yaschema';
import * as Y from 'yjs';

import { makeConflictFreeAsyncArrayFieldFromYArray } from '../makeConflictFreeAsyncArrayFieldFromYArray.ts';
import { makeConflictFreeDocumentFieldInfos } from '../makeConflictFreeDocumentFieldInfos.ts';

const itemSchema = schema.oneOf(schema.string(), schema.number());

describe('makeConflictFreeAsyncArrayFieldFromYArray', () => {
  describe('append', () => {
    it('appending onto an empty array should work', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      await cfArray.append(['hello', 3.14]);
      t.assert.strictEqual(cfArray.getLength(), 2);
      t.assert.strictEqual(await cfArray.get(0), 'hello');
      t.assert.strictEqual(await cfArray.get(1), 3.14);
    });

    it('appending onto a non-empty array should work', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      await cfArray.append(['hello', 3.14]);
      await cfArray.append(['one', 1]);
      t.assert.strictEqual(cfArray.getLength(), 4);
      t.assert.strictEqual(await cfArray.get(0), 'hello');
      t.assert.strictEqual(await cfArray.get(1), 3.14);
      t.assert.strictEqual(await cfArray.get(2), 'one');
      t.assert.strictEqual(await cfArray.get(3), 1);
    });
  });

  describe('clear', () => {
    it('clearing an empty array should work', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      t.assert.strictEqual(cfArray.getLength(), 0);

      cfArray.clear();
      t.assert.strictEqual(cfArray.getLength(), 0);
    });

    it('clearing a non-empty array should work', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      await cfArray.insert(0, ['hello', 3.14]);
      t.assert.strictEqual(cfArray.getLength(), 2);

      cfArray.clear();
      t.assert.strictEqual(cfArray.getLength(), 0);
    });
  });

  describe('findIndex', () => {
    it('should return a value < 0 when called on an empty list', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);

      const index = await cfArray.findIndex((item) => item === 'one');
      t.assert.strictEqual(index < 0, true);
    });

    it('should return a value < 0 when no matching value is found', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      await cfArray.append(['hello', 3.14, 'one', 1]);

      const index = await cfArray.findIndex((item) => item === 'goodbye');
      t.assert.strictEqual(index < 0, true);
    });

    it('should return a value >= 0 when a match is found', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      await cfArray.append(['hello', 3.14, 'one', 1]);

      const index = await cfArray.findIndex((item) => item === 'one');
      t.assert.strictEqual(index, 2);
    });
  });

  describe('get', () => {
    it('getting a negative index should return undefined', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      await cfArray.append(['hello', 3.14, 'one', 1]);

      const value = await cfArray.get(-1);
      t.assert.strictEqual(value, undefined);
    });

    it('getting a non-existent index should return undefined', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      await cfArray.append(['hello', 3.14, 'one', 1]);

      const value = await cfArray.get(99);
      t.assert.strictEqual(value, undefined);
    });
  });

  describe('insert', () => {
    it('inserting into an empty array should work', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      await cfArray.insert(0, ['hello', 3.14]);
      t.assert.strictEqual(cfArray.getLength(), 2);
      t.assert.strictEqual(await cfArray.get(0), 'hello');
      t.assert.strictEqual(await cfArray.get(1), 3.14);
    });

    it('inserting at the beginning of an array should work', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      await cfArray.insert(0, ['hello', 3.14]);
      await cfArray.insert(0, ['one', 1]);
      t.assert.strictEqual(cfArray.getLength(), 4);
      t.assert.strictEqual(await cfArray.get(0), 'one');
      t.assert.strictEqual(await cfArray.get(1), 1);
      t.assert.strictEqual(await cfArray.get(2), 'hello');
      t.assert.strictEqual(await cfArray.get(3), 3.14);
    });

    it('inserting at the end of an array should work', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      await cfArray.insert(0, ['hello', 3.14]);
      await cfArray.insert(cfArray.getLength(), ['one', 1]);
      t.assert.strictEqual(cfArray.getLength(), 4);
      t.assert.strictEqual(await cfArray.get(0), 'hello');
      t.assert.strictEqual(await cfArray.get(1), 3.14);
      t.assert.strictEqual(await cfArray.get(2), 'one');
      t.assert.strictEqual(await cfArray.get(3), 1);
    });

    it('inserting into the middle an array should work', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      await cfArray.insert(0, ['hello', 3.14]);
      await cfArray.insert(1, ['one', 1]);
      t.assert.strictEqual(cfArray.getLength(), 4);
      t.assert.strictEqual(await cfArray.get(0), 'hello');
      t.assert.strictEqual(await cfArray.get(1), 'one');
      t.assert.strictEqual(await cfArray.get(2), 1);
      t.assert.strictEqual(await cfArray.get(3), 3.14);
    });
  });

  describe('entries', () => {
    it('should work with default range and order', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      await cfArray.insert(0, ['hello', 3.14, 'one', 1]);

      t.assert.deepStrictEqual(await resolveEntries(cfArray.entries()), [
        [0, 'hello'],
        [1, 3.14],
        [2, 'one'],
        [3, 1]
      ]);
    });

    it('should work with default range and reverse order', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      await cfArray.insert(0, ['hello', 3.14, 'one', 1]);

      t.assert.deepStrictEqual(await resolveEntries(cfArray.entries(undefined, true)), [
        [3, 1],
        [2, 'one'],
        [1, 3.14],
        [0, 'hello']
      ]);
    });

    it('should work with number range and default order', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      await cfArray.insert(0, ['hello', 3.14, 'one', 1]);

      t.assert.deepStrictEqual(await resolveEntries(cfArray.entries(2)), [
        [2, 'one'],
        [3, 1]
      ]);
    });

    it('should work with number range and reverse order', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      await cfArray.insert(0, ['hello', 3.14, 'one', 1]);

      t.assert.deepStrictEqual(await resolveEntries(cfArray.entries(2, true)), [
        [3, 1],
        [2, 'one']
      ]);
    });

    it('should work with tuple range and default order', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      await cfArray.insert(0, ['hello', 3.14, 'one', 1]);

      t.assert.deepStrictEqual(await resolveEntries(cfArray.entries([1, 3])), [
        [1, 3.14],
        [2, 'one']
      ]);
    });

    it('should work with tuple range and reverse order', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      await cfArray.insert(0, ['hello', 3.14, 'one', 1]);

      t.assert.deepStrictEqual(await resolveEntries(cfArray.entries([1, 3], true)), [
        [2, 'one'],
        [1, 3.14]
      ]);
    });
  });

  describe('delete', () => {
    it('deleting at the beginning of an array should work', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      await cfArray.insert(0, ['hello', 3.14]);
      cfArray.delete(0, 1);
      t.assert.strictEqual(cfArray.getLength(), 1);
      t.assert.strictEqual(await cfArray.get(0), 3.14);
    });

    it('deleting at the end of an array should work', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      await cfArray.insert(0, ['hello', 3.14]);
      cfArray.delete(cfArray.getLength() - 1);
      t.assert.strictEqual(cfArray.getLength(), 1);
      t.assert.strictEqual(await cfArray.get(0), 'hello');
    });

    it('deleting from the middle an array should work', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      await cfArray.insert(0, ['hello', 3.14, 'one', 1]);
      cfArray.delete(1, 3);
      t.assert.strictEqual(cfArray.getLength(), 2);
      t.assert.strictEqual(await cfArray.get(0), 'hello');
      t.assert.strictEqual(await cfArray.get(1), 1);
    });

    it('deleting all items from an array should work', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      await cfArray.insert(0, ['hello', 3.14, 'one', 1]);
      cfArray.delete(0, cfArray.getLength());
      t.assert.strictEqual(cfArray.getLength(), 0);
    });
  });

  describe('slice', () => {
    it('should work', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      await cfArray.insert(0, ['hello', 3.14, 'one', 1]);
      const theSlice = await Promise.all(cfArray.slice(2));
      t.assert.strictEqual(cfArray.getLength(), 4);
      t.assert.deepStrictEqual(theSlice, ['one', 1]);
    });
  });

  describe('splice', () => {
    it('should work on an empty list', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      await cfArray.splice(0, 0, ['hello', 3.14]);
      t.assert.strictEqual(cfArray.getLength(), 2);
      t.assert.strictEqual(await cfArray.get(0), 'hello');
      t.assert.strictEqual(await cfArray.get(1), 3.14);
    });

    it('should work on a non-empty list without deleting', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      await cfArray.append(['hello', 3.14]);
      await cfArray.splice(1, 0, ['one', 1]);
      t.assert.strictEqual(cfArray.getLength(), 4);
      t.assert.strictEqual(await cfArray.get(0), 'hello');
      t.assert.strictEqual(await cfArray.get(1), 'one');
      t.assert.strictEqual(await cfArray.get(2), 1);
      t.assert.strictEqual(await cfArray.get(3), 3.14);
    });

    it('should work on a non-empty list with deleting', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      await cfArray.append(['hello', 3.14]);
      await cfArray.splice(1, 1, ['one', 1]);
      t.assert.strictEqual(cfArray.getLength(), 3);
      t.assert.strictEqual(await cfArray.get(0), 'hello');
      t.assert.strictEqual(await cfArray.get(1), 'one');
      t.assert.strictEqual(await cfArray.get(2), 1);
    });

    it('should work on a non-empty list with deleting and without new items', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      await cfArray.append(['hello', 3.14]);
      await cfArray.splice(1, 1, []);
      t.assert.strictEqual(cfArray.getLength(), 1);
      t.assert.strictEqual(await cfArray.get(0), 'hello');
    });
  });

  describe('values', () => {
    it('should work with default range and order', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      await cfArray.insert(0, ['hello', 3.14, 'one', 1]);

      t.assert.deepStrictEqual(await Promise.all(cfArray.values()), ['hello', 3.14, 'one', 1]);
    });

    it('should work with default range and reverse order', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      await cfArray.insert(0, ['hello', 3.14, 'one', 1]);

      t.assert.deepStrictEqual(await Promise.all(cfArray.values(undefined, true)), [1, 'one', 3.14, 'hello']);
    });

    it('should work with number range and default order', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      await cfArray.insert(0, ['hello', 3.14, 'one', 1]);

      t.assert.deepStrictEqual(await Promise.all(cfArray.values(2)), ['one', 1]);
    });

    it('should work with number range and reverse order', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      await cfArray.insert(0, ['hello', 3.14, 'one', 1]);

      t.assert.deepStrictEqual(await Promise.all(cfArray.values(2, true)), [1, 'one']);
    });

    it('should work with tuple range and default order', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      await cfArray.insert(0, ['hello', 3.14, 'one', 1]);

      t.assert.deepStrictEqual(await Promise.all(cfArray.values([1, 3])), [3.14, 'one']);
    });

    it('should work with tuple range and reverse order', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfArray = makeConflictFreeAsyncArrayFieldFromYArray(yDoc, fieldInfos, 'content', itemSchema);
      await cfArray.insert(0, ['hello', 3.14, 'one', 1]);

      t.assert.deepStrictEqual(await Promise.all(cfArray.values([1, 3], true)), ['one', 3.14]);
    });
  });
});

// Helpers

const resolveEntries = async <T>(entries: IterableIterator<[number, Promise<T>]>): Promise<Array<[number, T]>> => {
  const output: Array<[number, T]> = [];
  for (const [key, promisedValue] of entries) {
    output.push([key, await promisedValue]);
  }
  return output;
};
