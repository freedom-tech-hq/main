import type { TestContext } from 'node:test';
import { before, describe, it } from 'node:test';

import { makeSuccess } from 'freedom-async';
import { makeTrace } from 'freedom-contexts';
import { expectOk } from 'freedom-testing-tools';

import type { IndexStore } from '../../types/IndexStore.ts';
import { InMemoryIndexStore } from '../../types/InMemoryIndexStore.ts';
import { makeAffixedKeyIndexStore } from '../makeAffixedKeyIndexStore.ts';

describe('makeAffixedKeyIndexStore', () => {
  describe('when no correctly prefixed keys have been added', () => {
    const indexStore = new InMemoryIndexStore({ config: { type: 'key' } });
    const prefixedIndexStore = makeAffixedKeyIndexStore<'prefix:', string, '', unknown>(
      { prefix: 'prefix:', suffix: '' },
      indexStore as IndexStore<`prefix:${string}`, unknown>
    );

    const trace = makeTrace('test');

    before(async () => {
      expectOk(await indexStore.addToIndex(trace, 'hello', undefined));
      expectOk(await indexStore.addToIndex(trace, 'world', undefined));
      expectOk(await indexStore.addToIndex(trace, 'one', undefined));
      expectOk(await indexStore.addToIndex(trace, 'two', undefined));
      expectOk(await indexStore.addToIndex(trace, 'three', undefined));
      expectOk(await indexStore.addToIndex(trace, 'four', undefined));
    });

    it('count should be 0', async (t: TestContext) => {
      const count = await prefixedIndexStore.count(trace);
      expectOk(count);
      t.assert.strictEqual(count.value, 0);
    });
  });

  describe('when prefixed and suffixed keys have been added', () => {
    const indexStore = new InMemoryIndexStore({ config: { type: 'key' } });
    const prefixedIndexStore = makeAffixedKeyIndexStore<'prefix:', string, ':suffix', unknown>(
      { prefix: 'prefix:', suffix: ':suffix' },
      indexStore as IndexStore<`prefix:${string}:suffix`, unknown>
    );

    const trace = makeTrace('test');

    before(async () => {
      expectOk(await indexStore.addToIndex(trace, 'prefix:hello:suffix', undefined));
      expectOk(await indexStore.addToIndex(trace, 'world', undefined));
      expectOk(await indexStore.addToIndex(trace, 'prefix:one:suffix', undefined));
      expectOk(await indexStore.addToIndex(trace, 'prefix:two:suffix', undefined));
      expectOk(await indexStore.addToIndex(trace, 'prefix:three:suffix', undefined));
      expectOk(await indexStore.addToIndex(trace, 'prefix:four:suffix', undefined));
    });

    it('count should be correct', async (t: TestContext) => {
      const count = await prefixedIndexStore.count(trace);
      expectOk(count);
      t.assert.strictEqual(count.value, 5);
    });

    it('count should be correct when combined with prefix', async (t: TestContext) => {
      const count = await prefixedIndexStore.count(trace, { prefix: 'h' });
      expectOk(count);
      t.assert.strictEqual(count.value, 1);
    });

    it('asc().keys should return all correctly prefixed keys, in ascending order', async (t: TestContext) => {
      const keys = await prefixedIndexStore.asc().keys(trace);
      expectOk(keys);
      t.assert.deepStrictEqual(keys.value, ['four', 'hello', 'one', 'three', 'two']);
    });

    it("asc({ prefix:'h' }).keys should return all correctly prefixed keys, in ascending order, when combined with prefix", async (t: TestContext) => {
      const keys = await prefixedIndexStore.asc({ prefix: 'h' }).keys(trace);
      expectOk(keys);
      t.assert.deepStrictEqual(keys.value, ['hello']);
    });

    it('desc().keys should return all correctly prefixed keys, in descending order', async (t: TestContext) => {
      const keys = await prefixedIndexStore.desc().keys(trace);
      expectOk(keys);
      t.assert.deepStrictEqual(keys.value, ['two', 'three', 'one', 'hello', 'four']);
    });

    it("desc({ prefix:'h' }).keys should return all correctly prefixed keys, in descending order, when combined with prefix", async (t: TestContext) => {
      const keys = await prefixedIndexStore.desc({ prefix: 'h' }).keys(trace);
      expectOk(keys);
      t.assert.deepStrictEqual(keys.value, ['hello']);
    });

    it('keyRange(…).entries should work', async (t: TestContext) => {
      const keys = await prefixedIndexStore.keyRange('hello', 'three').entries(trace);
      expectOk(keys);
      t.assert.deepStrictEqual(keys.value, [
        ['hello', undefined],
        ['one', undefined],
        ['three', undefined]
      ]);
    });

    it('keyRange(…).entries should work, when combined with prefix', async (t: TestContext) => {
      const keys = await prefixedIndexStore.keyRange('hello', 'three', { prefix: 'h' }).entries(trace);
      expectOk(keys);
      t.assert.deepStrictEqual(keys.value, [['hello', undefined]]);
    });

    it('keyRange(…).forEach should work', async (t: TestContext) => {
      const keys: string[] = [];
      expectOk(
        await prefixedIndexStore.keyRange('hello', 'three', { prefix: 'h' }).forEach(trace, async (_trace, key) => {
          keys.push(key);
          return makeSuccess(undefined);
        })
      );
      t.assert.deepStrictEqual(keys, ['hello']);
    });

    it('keyRange(…).keys should work', async (t: TestContext) => {
      const keys = await prefixedIndexStore.keyRange('hello', 'three').keys(trace);
      expectOk(keys);
      t.assert.deepStrictEqual(keys.value, ['hello', 'one', 'three']);
    });

    it('keyRange(…).keys should work, when combined with prefix', async (t: TestContext) => {
      const keys = await prefixedIndexStore.keyRange('hello', 'three', { prefix: 'h' }).keys(trace);
      expectOk(keys);
      t.assert.deepStrictEqual(keys.value, ['hello']);
    });
  });
});
