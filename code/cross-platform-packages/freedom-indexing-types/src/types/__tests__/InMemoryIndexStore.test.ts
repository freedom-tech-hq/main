import type { TestContext } from 'node:test';
import { before, describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { expectOk } from 'freedom-testing-tools';

import { InMemoryIndexStore } from '../InMemoryIndexStore.ts';

describe('InMemoryIndexStore', () => {
  it('count should be 0 on empty index store', async (t: TestContext) => {
    const indexStore = new InMemoryIndexStore({ config: { type: 'key' } });

    const trace = makeTrace('test');

    const count = await indexStore.count(trace);
    expectOk(count);
    t.assert.strictEqual(count.value, 0);
  });

  it('count should be correct for non-empty index stores', async (t: TestContext) => {
    const indexStore = new InMemoryIndexStore({ config: { type: 'key' } });

    const trace = makeTrace('test');
    expectOk(await indexStore.addToIndex(trace, 'hello', undefined));
    expectOk(await indexStore.addToIndex(trace, 'world', undefined));

    const count = await indexStore.count(trace);
    expectOk(count);
    t.assert.strictEqual(count.value, 2);
  });

  it('count should be correct with prefix option', async (t: TestContext) => {
    const indexStore = new InMemoryIndexStore({ config: { type: 'key' } });

    const trace = makeTrace('test');
    expectOk(await indexStore.addToIndex(trace, 'hello', undefined));
    expectOk(await indexStore.addToIndex(trace, 'world', undefined));

    const count = await indexStore.count(trace, { prefix: 'h' });
    expectOk(count);
    t.assert.strictEqual(count.value, 1);
  });

  it('count should be correct after removeFromIndex', async (t: TestContext) => {
    const indexStore = new InMemoryIndexStore({ config: { type: 'key' } });

    const trace = makeTrace('test');
    expectOk(await indexStore.addToIndex(trace, 'hello', undefined));
    expectOk(await indexStore.addToIndex(trace, 'world', undefined));
    expectOk(await indexStore.removeFromIndex(trace, 'hello'));

    const count = await indexStore.count(trace);
    expectOk(count);
    t.assert.strictEqual(count.value, 1);
  });

  it('calling addToIndex twice with the same key should update the value', async (t: TestContext) => {
    const indexStore = new InMemoryIndexStore<string, number>({ config: { type: 'key' } });

    const trace = makeTrace('test');
    expectOk(await indexStore.addToIndex(trace, 'hello', 3.14));
    expectOk(await indexStore.addToIndex(trace, 'world', 1));

    const entries1 = await indexStore.asc().entries(trace);
    expectOk(entries1);
    t.assert.deepStrictEqual(entries1.value, [
      ['hello', 3.14],
      ['world', 1]
    ]);

    expectOk(await indexStore.addToIndex(trace, 'hello', 6.28));

    const entries2 = await indexStore.asc().entries(trace);
    expectOk(entries2);
    t.assert.deepStrictEqual(entries2.value, [
      ['hello', 6.28],
      ['world', 1]
    ]);
  });

  it('asc().keys should return all keys in order', async (t: TestContext) => {
    const indexStore = new InMemoryIndexStore({ config: { type: 'key' } });

    const trace = makeTrace('test');
    expectOk(await indexStore.addToIndex(trace, 'hello', undefined));
    expectOk(await indexStore.addToIndex(trace, 'world', undefined));

    const keys = await indexStore.asc().keys(trace);
    expectOk(keys);
    t.assert.deepStrictEqual(keys.value, ['hello', 'world']);
  });

  it("asc({ prefix: 'h' }).keys should return all keys with 'h' prefix in order", async (t: TestContext) => {
    const indexStore = new InMemoryIndexStore({ config: { type: 'key' } });

    const trace = makeTrace('test');
    expectOk(await indexStore.addToIndex(trace, 'hello', undefined));
    expectOk(await indexStore.addToIndex(trace, 'world', undefined));

    const keys = await indexStore.asc({ prefix: 'h' }).keys(trace);
    expectOk(keys);
    t.assert.deepStrictEqual(keys.value, ['hello']);
  });

  it('asc({ offset: 1 }).keys should work', async (t: TestContext) => {
    const indexStore = new InMemoryIndexStore({ config: { type: 'key' } });

    const trace = makeTrace('test');
    expectOk(await indexStore.addToIndex(trace, 'hello', undefined));
    expectOk(await indexStore.addToIndex(trace, 'world', undefined));

    const keys = await indexStore.asc({ offset: 1 }).keys(trace);
    expectOk(keys);
    t.assert.deepStrictEqual(keys.value, ['world']);
  });

  it('asc({ offset: 1, limit: 0 }).keys should work', async (t: TestContext) => {
    const indexStore = new InMemoryIndexStore({ config: { type: 'key' } });

    const trace = makeTrace('test');
    expectOk(await indexStore.addToIndex(trace, 'hello', undefined));
    expectOk(await indexStore.addToIndex(trace, 'world', undefined));

    const keys = await indexStore.asc({ offset: 1, limit: 0 }).keys(trace);
    expectOk(keys);
    t.assert.deepStrictEqual(keys.value, []);
  });

  it('asc({ offset: 1, limit: 1 }).keys should work', async (t: TestContext) => {
    const indexStore = new InMemoryIndexStore({ config: { type: 'key' } });

    const trace = makeTrace('test');
    expectOk(await indexStore.addToIndex(trace, 'hello', undefined));
    expectOk(await indexStore.addToIndex(trace, 'world', undefined));

    const keys = await indexStore.asc({ offset: 1, limit: 1 }).keys(trace);
    expectOk(keys);
    t.assert.deepStrictEqual(keys.value, ['world']);
  });

  it('desc().keys should return all keys in reverse order', async (t: TestContext) => {
    const indexStore = new InMemoryIndexStore({ config: { type: 'key' } });

    const trace = makeTrace('test');
    expectOk(await indexStore.addToIndex(trace, 'hello', undefined));
    expectOk(await indexStore.addToIndex(trace, 'world', undefined));

    const keys = await indexStore.desc().keys(trace);
    expectOk(keys);
    t.assert.deepStrictEqual(keys.value, ['world', 'hello']);
  });

  it('desc({ offset: 1 }).keys should return all keys in reverse order', async (t: TestContext) => {
    const indexStore = new InMemoryIndexStore({ config: { type: 'key' } });

    const trace = makeTrace('test');
    expectOk(await indexStore.addToIndex(trace, 'hello', undefined));
    expectOk(await indexStore.addToIndex(trace, 'world', undefined));

    const keys = await indexStore.desc({ offset: 1 }).keys(trace);
    expectOk(keys);
    t.assert.deepStrictEqual(keys.value, ['hello']);
  });

  describe('keyRange', () => {
    const indexStore = new InMemoryIndexStore({ config: { type: 'key' } });

    const trace = makeTrace('test');

    before(async () => {
      expectOk(await indexStore.addToIndex(trace, 'hello', undefined));
      expectOk(await indexStore.addToIndex(trace, 'world', undefined));
      expectOk(await indexStore.addToIndex(trace, 'one', undefined));
      expectOk(await indexStore.addToIndex(trace, 'two', undefined));
      expectOk(await indexStore.addToIndex(trace, 'three', undefined));
      expectOk(await indexStore.addToIndex(trace, 'four', undefined));
    });

    it('keyRange with undefined min and max keys should work', async (t: TestContext) => {
      const keys = await indexStore.keyRange(undefined, undefined).keys(trace);
      expectOk(keys);
      t.assert.deepStrictEqual(keys.value, ['four', 'hello', 'one', 'three', 'two', 'world']);
    });

    it('keyRange with same inclusive min and max keys should work', async (t: TestContext) => {
      const keys = await indexStore.keyRange('one', 'one').keys(trace);
      expectOk(keys);
      t.assert.deepStrictEqual(keys.value, ['one']);
    });

    it('keyRange with same exclusive min and max keys should work', async (t: TestContext) => {
      const keys = await indexStore.keyRange('one', 'one', { inclusiveMin: false, inclusiveMax: false }).keys(trace);
      expectOk(keys);
      t.assert.deepStrictEqual(keys.value, []);
    });

    it('keyRange with inclusive min and max keys should work', async (t: TestContext) => {
      const keys = await indexStore.keyRange('one', 'two').keys(trace);
      expectOk(keys);
      t.assert.deepStrictEqual(keys.value, ['one', 'three', 'two']);
    });

    it('keyRange with exclusive min and max keys should work', async (t: TestContext) => {
      const keys = await indexStore.keyRange('one', 'two', { inclusiveMin: false, inclusiveMax: false }).keys(trace);
      expectOk(keys);
      t.assert.deepStrictEqual(keys.value, ['three']);
    });

    it('keyRange with inclusive min and undefined max keys should work', async (t: TestContext) => {
      const keys = await indexStore.keyRange('one', undefined).keys(trace);
      expectOk(keys);
      t.assert.deepStrictEqual(keys.value, ['one', 'three', 'two', 'world']);
    });
  });
});
