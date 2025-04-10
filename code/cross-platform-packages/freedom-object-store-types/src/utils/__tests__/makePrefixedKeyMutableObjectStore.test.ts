import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { Cast } from 'freedom-cast';
import { makeTrace } from 'freedom-contexts';
import { expectOk } from 'freedom-testing-tools';
import { schema } from 'yaschema';

import { InMemoryObjectStore } from '../../types/InMemoryObjectStore.ts';
import { makePrefixedKeyMutableObjectStore } from '../makePrefixedKeyMutableObjectStore.ts';

describe('makePrefixedKeyMutableObjectStore', () => {
  it('should work', async (t: TestContext) => {
    const trace = makeTrace('test');

    const objectStore = new InMemoryObjectStore({ _keyType: Cast<`hello:${'a' | 'b' | 'c'}`>(), schema: valueSchema });
    const prefixedObjectStore = makePrefixedKeyMutableObjectStore<'hello:', 'a' | 'b' | 'c', number>('hello:', objectStore);

    expectOk(await prefixedObjectStore.mutableObject('a').create(trace, 0));
    expectOk(await prefixedObjectStore.mutableObject('b').create(trace, 1));
    expectOk(await prefixedObjectStore.mutableObject('c').create(trace, 2));

    const nonPrefixedKeys = await prefixedObjectStore.keys.asc().keys(trace);
    expectOk(nonPrefixedKeys);
    t.assert.strictEqual(nonPrefixedKeys.value.length, 3);
    t.assert.deepStrictEqual(nonPrefixedKeys.value, ['a', 'b', 'c']);

    const keys = await objectStore.keys.asc().keys(trace);
    expectOk(keys);
    t.assert.strictEqual(keys.value.length, 3);
    t.assert.deepStrictEqual(keys.value, ['hello:a', 'hello:b', 'hello:c']);

    const exists = await prefixedObjectStore.object('a').exists(trace);
    expectOk(exists);
    t.assert.strictEqual(exists.value, true);

    const aValue = await prefixedObjectStore.mutableObject('a').getMutable(trace);
    expectOk(aValue);
    t.assert.deepStrictEqual(aValue.value, { storedValue: 0, updateCount: 0 });
  });

  it('keyRange with undefined min and exclusive max arguments, should work on a non-empty object store', async (t: TestContext) => {
    const trace = makeTrace('test');

    const objectStore = new InMemoryObjectStore({ _keyType: Cast<`hello:${string}`>(), schema: valueSchema });
    const prefixedObjectStore = makePrefixedKeyMutableObjectStore<'hello:', string, number>('hello:', objectStore);

    expectOk(await prefixedObjectStore.mutableObject('a').create(trace, 0));
    expectOk(await prefixedObjectStore.mutableObject('b').create(trace, 1));
    expectOk(await prefixedObjectStore.mutableObject('c').create(trace, 2));
    expectOk(await prefixedObjectStore.mutableObject('d').create(trace, 3));
    expectOk(await prefixedObjectStore.mutableObject('e').create(trace, 4));

    const keys = await prefixedObjectStore.keys.keyRange(undefined, 'd', { inclusiveMax: false }).keys(trace);
    expectOk(keys);
    t.assert.strictEqual(keys.value.length, 3);
    t.assert.deepStrictEqual(keys.value, ['a', 'b', 'c']);
  });

  it('keyRange with undefined min and inclusive max arguments, should work on a non-empty object store', async (t: TestContext) => {
    const trace = makeTrace('test');

    const objectStore = new InMemoryObjectStore({ _keyType: Cast<`hello:${string}`>(), schema: valueSchema });
    const prefixedObjectStore = makePrefixedKeyMutableObjectStore<'hello:', string, number>('hello:', objectStore);

    expectOk(await prefixedObjectStore.mutableObject('a').create(trace, 0));
    expectOk(await prefixedObjectStore.mutableObject('b').create(trace, 1));
    expectOk(await prefixedObjectStore.mutableObject('c').create(trace, 2));
    expectOk(await prefixedObjectStore.mutableObject('d').create(trace, 3));
    expectOk(await prefixedObjectStore.mutableObject('e').create(trace, 4));

    const keys = await prefixedObjectStore.keys.keyRange(undefined, 'd').keys(trace);
    expectOk(keys);
    t.assert.strictEqual(keys.value.length, 4);
    t.assert.deepStrictEqual(keys.value, ['a', 'b', 'c', 'd']);
  });

  it('keyRange with exclusive min and undefined max arguments, should work on a non-empty object store', async (t: TestContext) => {
    const trace = makeTrace('test');

    const objectStore = new InMemoryObjectStore({ _keyType: Cast<`hello:${string}`>(), schema: valueSchema });
    const prefixedObjectStore = makePrefixedKeyMutableObjectStore<'hello:', string, number>('hello:', objectStore);

    expectOk(await prefixedObjectStore.mutableObject('a').create(trace, 0));
    expectOk(await prefixedObjectStore.mutableObject('b').create(trace, 1));
    expectOk(await prefixedObjectStore.mutableObject('c').create(trace, 2));
    expectOk(await prefixedObjectStore.mutableObject('d').create(trace, 3));
    expectOk(await prefixedObjectStore.mutableObject('e').create(trace, 4));

    const keys = await prefixedObjectStore.keys.keyRange('b', undefined, { inclusiveMin: false }).keys(trace);
    expectOk(keys);
    t.assert.strictEqual(keys.value.length, 3);
    t.assert.deepStrictEqual(keys.value, ['c', 'd', 'e']);
  });

  it('keyRange with inclusive min and undefined max arguments, should work on a non-empty object store', async (t: TestContext) => {
    const trace = makeTrace('test');

    const objectStore = new InMemoryObjectStore({ _keyType: Cast<`hello:${string}`>(), schema: valueSchema });
    const prefixedObjectStore = makePrefixedKeyMutableObjectStore<'hello:', string, number>('hello:', objectStore);

    expectOk(await prefixedObjectStore.mutableObject('a').create(trace, 0));
    expectOk(await prefixedObjectStore.mutableObject('b').create(trace, 1));
    expectOk(await prefixedObjectStore.mutableObject('c').create(trace, 2));
    expectOk(await prefixedObjectStore.mutableObject('d').create(trace, 3));
    expectOk(await prefixedObjectStore.mutableObject('e').create(trace, 4));

    const keys = await prefixedObjectStore.keys.keyRange('b', undefined).keys(trace);
    expectOk(keys);
    t.assert.strictEqual(keys.value.length, 4);
    t.assert.deepStrictEqual(keys.value, ['b', 'c', 'd', 'e']);
  });

  it('keyRange with inclusive min and max arguments, should work on a non-empty object store', async (t: TestContext) => {
    const trace = makeTrace('test');

    const objectStore = new InMemoryObjectStore({ _keyType: Cast<`hello:${string}`>(), schema: valueSchema });
    const prefixedObjectStore = makePrefixedKeyMutableObjectStore<'hello:', string, number>('hello:', objectStore);

    expectOk(await prefixedObjectStore.mutableObject('a').create(trace, 0));
    expectOk(await prefixedObjectStore.mutableObject('b').create(trace, 1));
    expectOk(await prefixedObjectStore.mutableObject('c').create(trace, 2));
    expectOk(await prefixedObjectStore.mutableObject('d').create(trace, 3));
    expectOk(await prefixedObjectStore.mutableObject('e').create(trace, 4));

    const keys = await prefixedObjectStore.keys.keyRange('b', 'd').keys(trace);
    expectOk(keys);
    t.assert.strictEqual(keys.value.length, 3);
    t.assert.deepStrictEqual(keys.value, ['b', 'c', 'd']);
  });

  it('getMultiple should work when all keys are found', async (t: TestContext) => {
    const trace = makeTrace('test');

    const objectStore = new InMemoryObjectStore({ _keyType: Cast<`hello:${string}`>(), schema: valueSchema });
    const prefixedObjectStore = makePrefixedKeyMutableObjectStore<'hello:', string, number>('hello:', objectStore);

    expectOk(await prefixedObjectStore.mutableObject('a').create(trace, 0));
    expectOk(await prefixedObjectStore.mutableObject('b').create(trace, 1));
    expectOk(await prefixedObjectStore.mutableObject('c').create(trace, 2));
    expectOk(await prefixedObjectStore.mutableObject('d').create(trace, 3));
    expectOk(await prefixedObjectStore.mutableObject('e').create(trace, 4));

    const values = await prefixedObjectStore.getMultiple(trace, ['a', 'c', 'e']);
    expectOk(values);
    t.assert.deepStrictEqual(values.value.found, { a: 0, c: 2, e: 4 });
    t.assert.deepStrictEqual(values.value.notFound, []);
  });

  it('getMultiple should work when some keys are not found', async (t: TestContext) => {
    const trace = makeTrace('test');

    const objectStore = new InMemoryObjectStore({ _keyType: Cast<`hello:${string}`>(), schema: valueSchema });
    const prefixedObjectStore = makePrefixedKeyMutableObjectStore<'hello:', string, number>('hello:', objectStore);

    expectOk(await prefixedObjectStore.mutableObject('a').create(trace, 0));
    expectOk(await prefixedObjectStore.mutableObject('b').create(trace, 1));
    expectOk(await prefixedObjectStore.mutableObject('c').create(trace, 2));
    expectOk(await prefixedObjectStore.mutableObject('d').create(trace, 3));
    expectOk(await prefixedObjectStore.mutableObject('e').create(trace, 4));

    const values = await prefixedObjectStore.getMultiple(trace, ['a', 'c', 'e', 'f']);
    expectOk(values);
    t.assert.deepStrictEqual(values.value.found, { a: 0, c: 2, e: 4 });
    t.assert.deepStrictEqual(values.value.notFound, ['f']);
  });
});

// Helpers

const valueSchema = schema.number();
