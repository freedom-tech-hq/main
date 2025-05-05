import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { schema } from 'yaschema';
import * as Y from 'yjs';

import { makeConflictFreeAsyncMapFieldFromYMap } from '../makeConflictFreeAsyncMapFieldFromYMap.ts';
import { makeConflictFreeDocumentFieldInfos } from '../makeConflictFreeDocumentFieldInfos.ts';

const itemSchema = schema.oneOf(schema.string(), schema.number());

describe('makeConflictFreeAsyncMapFieldFromYMap', () => {
  describe('clear', () => {
    it('clearing an empty array should work', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfMap = makeConflictFreeAsyncMapFieldFromYMap(yDoc, fieldInfos, 'content', itemSchema);
      t.assert.strictEqual(cfMap.isEmpty(), true);

      cfMap.clear();
      t.assert.strictEqual(cfMap.isEmpty(), true);
    });

    it('clearing a non-empty array should work', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfMap = makeConflictFreeAsyncMapFieldFromYMap(yDoc, fieldInfos, 'content', itemSchema);
      await cfMap.set('hello', 'world');
      t.assert.strictEqual(cfMap.isEmpty(), false);

      cfMap.clear();
      t.assert.strictEqual(cfMap.isEmpty(), true);
    });
  });

  describe('set', () => {
    it('adding a key to an empty map should work', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfMap = makeConflictFreeAsyncMapFieldFromYMap(yDoc, fieldInfos, 'content', itemSchema);
      t.assert.strictEqual(cfMap.has('hello'), false);
      await cfMap.set('hello', 'world');
      t.assert.strictEqual(cfMap.has('hello'), true);
      t.assert.strictEqual(await cfMap.get('hello'), 'world');
      t.assert.deepStrictEqual(Array.from(cfMap.keys()), ['hello']);
    });

    it('adding a second key to a map should work', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfMap = makeConflictFreeAsyncMapFieldFromYMap(yDoc, fieldInfos, 'content', itemSchema);
      await cfMap.set('hello', 'world');
      await cfMap.set('goodbye', '1');
      t.assert.strictEqual(cfMap.has('hello'), true);
      t.assert.strictEqual(cfMap.has('goodbye'), true);
      t.assert.strictEqual(await cfMap.get('hello'), 'world');
      t.assert.strictEqual(await cfMap.get('goodbye'), '1');
      t.assert.deepStrictEqual(Array.from(cfMap.keys()), ['hello', 'goodbye']);
    });
  });

  describe('delete', () => {
    it('should work', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfMap = makeConflictFreeAsyncMapFieldFromYMap(yDoc, fieldInfos, 'content', itemSchema);
      await cfMap.set('hello', 'world');
      await cfMap.set('goodbye', '1');
      cfMap.delete('hello');
      t.assert.strictEqual(cfMap.has('hello'), false);
      t.assert.strictEqual(cfMap.has('goodbye'), true);
      t.assert.strictEqual(await cfMap.get('hello'), undefined);
      t.assert.strictEqual(await cfMap.get('goodbye'), '1');
      t.assert.deepStrictEqual(Array.from(cfMap.keys()), ['goodbye']);
    });
  });

  describe('entries', () => {
    it('should work with default range and order', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfMap = makeConflictFreeAsyncMapFieldFromYMap(yDoc, fieldInfos, 'content', itemSchema);
      await cfMap.set('hello', 'world');
      await cfMap.set('goodbye', '1');
      await cfMap.set('foo', 3.14);
      await cfMap.set('bar', 1);

      t.assert.deepStrictEqual(await resolveEntries(cfMap.entries()), [
        ['hello', 'world'],
        ['goodbye', '1'],
        ['foo', 3.14],
        ['bar', 1]
      ]);
    });

    it('should work with default range and reverse order', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfMap = makeConflictFreeAsyncMapFieldFromYMap(yDoc, fieldInfos, 'content', itemSchema);
      await cfMap.set('hello', 'world');
      await cfMap.set('goodbye', '1');
      await cfMap.set('foo', 3.14);
      await cfMap.set('bar', 1);

      t.assert.deepStrictEqual(await resolveEntries(cfMap.entries(undefined, true)), [
        ['bar', 1],
        ['foo', 3.14],
        ['goodbye', '1'],
        ['hello', 'world']
      ]);
    });

    it('should work with tuple range and default order', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfMap = makeConflictFreeAsyncMapFieldFromYMap(yDoc, fieldInfos, 'content', itemSchema);
      await cfMap.set('hello', 'world');
      await cfMap.set('goodbye', '1');
      await cfMap.set('foo', 3.14);
      await cfMap.set('bar', 1);

      t.assert.deepStrictEqual(await resolveEntries(cfMap.entries(['goodbye', 'bar'])), [
        ['goodbye', '1'],
        ['foo', 3.14],
        ['bar', 1]
      ]);
    });

    it('should work with tuple range and reverse order', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfMap = makeConflictFreeAsyncMapFieldFromYMap(yDoc, fieldInfos, 'content', itemSchema);
      await cfMap.set('hello', 'world');
      await cfMap.set('goodbye', '1');
      await cfMap.set('foo', 3.14);
      await cfMap.set('bar', 1);

      t.assert.deepStrictEqual(await resolveEntries(cfMap.entries(['goodbye', 'bar'], true)), [
        ['bar', 1],
        ['foo', 3.14],
        ['goodbye', '1']
      ]);
    });
  });

  describe('keys', () => {
    it('should work with default range and order', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfMap = makeConflictFreeAsyncMapFieldFromYMap(yDoc, fieldInfos, 'content', itemSchema);
      await cfMap.set('hello', 'world');
      await cfMap.set('goodbye', '1');
      await cfMap.set('foo', 3.14);
      await cfMap.set('bar', 1);

      t.assert.deepStrictEqual(Array.from(cfMap.keys()), ['hello', 'goodbye', 'foo', 'bar']);
    });

    it('should work with default range and reverse order', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfMap = makeConflictFreeAsyncMapFieldFromYMap(yDoc, fieldInfos, 'content', itemSchema);
      await cfMap.set('hello', 'world');
      await cfMap.set('goodbye', '1');
      await cfMap.set('foo', 3.14);
      await cfMap.set('bar', 1);

      t.assert.deepStrictEqual(Array.from(cfMap.keys(undefined, true)), ['bar', 'foo', 'goodbye', 'hello']);
    });

    it('should work with tuple range and default order', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfMap = makeConflictFreeAsyncMapFieldFromYMap(yDoc, fieldInfos, 'content', itemSchema);
      await cfMap.set('hello', 'world');
      await cfMap.set('goodbye', '1');
      await cfMap.set('foo', 3.14);
      await cfMap.set('bar', 1);

      t.assert.deepStrictEqual(Array.from(cfMap.keys(['goodbye', 'bar'])), ['goodbye', 'foo', 'bar']);
    });

    it('should work with tuple range and reverse order', async (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfMap = makeConflictFreeAsyncMapFieldFromYMap(yDoc, fieldInfos, 'content', itemSchema);
      await cfMap.set('hello', 'world');
      await cfMap.set('goodbye', '1');
      await cfMap.set('foo', 3.14);
      await cfMap.set('bar', 1);

      t.assert.deepStrictEqual(Array.from(cfMap.keys(['goodbye', 'bar'], true)), ['bar', 'foo', 'goodbye']);
    });
  });
});

// Helpers

const resolveEntries = async <K extends string, T>(entries: IterableIterator<[K, Promise<T>]>): Promise<Array<[K, T]>> => {
  const output: Array<[K, T]> = [];
  for (const [key, promisedValue] of entries) {
    output.push([key, await promisedValue]);
  }
  return output;
};
