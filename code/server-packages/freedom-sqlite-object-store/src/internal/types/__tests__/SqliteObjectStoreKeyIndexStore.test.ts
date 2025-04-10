import type { TestContext } from 'node:test';
import { afterEach, beforeEach, describe, it } from 'node:test';

import sqlite3 from 'better-sqlite3';
import type { Trace } from 'freedom-contexts';
import { makeTrace } from 'freedom-contexts';
import { expectOk, expectStrictEqual } from 'freedom-testing-tools';
import { schema } from 'yaschema';

import { SqliteObjectStore } from '../../../types/SqliteObjectStore.ts';

const valueSchema = schema.number();

describe('SqliteObjectStoreKeyIndexStore', () => {
  let trace: Trace;
  let db: sqlite3.Database;
  let objectStore: SqliteObjectStore<string, number>;
  beforeEach(async () => {
    trace = makeTrace('test');
    try {
      db = sqlite3(':memory:');
      objectStore = new SqliteObjectStore({ db, schema: valueSchema, tableName: 'my_objects' });
      expectOk(await objectStore.initializeDb(trace));
    } catch (e) {
      console.log('BROKEN HERE', e);
    }
  });

  afterEach(async () => {
    db.close();
  });

  it('count should be 0 on empty index store', async (t: TestContext) => {
    const indexStore = objectStore.keys;

    const trace = makeTrace('test');

    const count = await indexStore.count(trace);
    expectOk(count);
    t.assert.strictEqual(count.value, 0);
  });

  it('count should be correct for non-empty index stores', async (t: TestContext) => {
    const indexStore = objectStore.keys;

    expectOk(await objectStore.mutableObject('hello').create(trace, 3.14));
    expectOk(await objectStore.mutableObject('world').create(trace, 3.14));

    const count = await indexStore.count(trace);
    expectOk(count);
    t.assert.strictEqual(count.value, 2);
  });

  it('count should be correct with prefix option', async (t: TestContext) => {
    const indexStore = objectStore.keys;

    expectOk(await objectStore.mutableObject('hello').create(trace, 3.14));
    expectOk(await objectStore.mutableObject('world').create(trace, 3.14));

    const count = await indexStore.count(trace, { prefix: 'h' });
    expectOk(count);
    t.assert.strictEqual(count.value, 1);
  });

  it('count should be correct after delete', async (t: TestContext) => {
    const indexStore = objectStore.keys;

    expectOk(await objectStore.mutableObject('hello').create(trace, 3.14));
    expectOk(await objectStore.mutableObject('world').create(trace, 3.14));
    expectOk(await objectStore.mutableObject('hello').delete(trace));

    const count = await indexStore.count(trace);
    expectOk(count);
    t.assert.strictEqual(count.value, 1);
  });

  it('update should work', async (t: TestContext) => {
    const indexStore = objectStore.keys;

    expectOk(await objectStore.mutableObject('hello').create(trace, 3.14));
    expectOk(await objectStore.mutableObject('world').create(trace, 3.14));

    const entries1 = await indexStore.asc().entries(trace);
    expectOk(entries1);
    t.assert.deepStrictEqual(entries1.value, [
      ['hello', undefined],
      ['world', undefined]
    ]);

    const got1 = await objectStore.mutableObject('hello').getMutable(trace);
    expectOk(got1);
    expectStrictEqual(got1.value.storedValue, 3.14);
    got1.value.storedValue = 6.28;
    expectOk(await objectStore.mutableObject('hello').update(trace, got1.value));

    const entries2 = await indexStore.asc().entries(trace);
    expectOk(entries2);
    t.assert.deepStrictEqual(entries2.value, [
      ['hello', undefined],
      ['world', undefined]
    ]);

    const got2 = await objectStore.mutableObject('hello').getMutable(trace);
    expectOk(got2);
    expectStrictEqual(got2.value.storedValue, 6.28);
  });

  it('asc().keys should return all keys in order', async (t: TestContext) => {
    const indexStore = objectStore.keys;

    expectOk(await objectStore.mutableObject('hello').create(trace, 3.14));
    expectOk(await objectStore.mutableObject('world').create(trace, 3.14));

    const keys = await indexStore.asc().keys(trace);
    expectOk(keys);
    t.assert.deepStrictEqual(keys.value, ['hello', 'world']);
  });

  it("asc({ prefix: 'h' }).keys should return all keys with 'h' prefix in order", async (t: TestContext) => {
    const indexStore = objectStore.keys;

    expectOk(await objectStore.mutableObject('hello').create(trace, 3.14));
    expectOk(await objectStore.mutableObject('world').create(trace, 3.14));

    const keys = await indexStore.asc({ prefix: 'h' }).keys(trace);
    expectOk(keys);
    t.assert.deepStrictEqual(keys.value, ['hello']);
  });

  it("asc({ suffix: 'o' }).keys should return all keys with 'o' suffix in order", async (t: TestContext) => {
    const indexStore = objectStore.keys;

    expectOk(await objectStore.mutableObject('hello').create(trace, 3.14));
    expectOk(await objectStore.mutableObject('world').create(trace, 3.14));

    const keys = await indexStore.asc({ suffix: 'o' }).keys(trace);
    expectOk(keys);
    t.assert.deepStrictEqual(keys.value, ['hello']);
  });

  it("asc({ prefix: 'h', suffix: 'o' }).keys should return all keys with 'h' prefix and 'o' suffix in order", async (t: TestContext) => {
    const indexStore = objectStore.keys;

    expectOk(await objectStore.mutableObject('hello').create(trace, 3.14));
    expectOk(await objectStore.mutableObject('world').create(trace, 3.14));

    const keys = await indexStore.asc({ prefix: 'h', suffix: 'o' }).keys(trace);
    expectOk(keys);
    t.assert.deepStrictEqual(keys.value, ['hello']);
  });

  it('asc({ offset: 1 }).keys should work', async (t: TestContext) => {
    const indexStore = objectStore.keys;

    expectOk(await objectStore.mutableObject('hello').create(trace, 3.14));
    expectOk(await objectStore.mutableObject('world').create(trace, 3.14));

    const keys = await indexStore.asc({ offset: 1 }).keys(trace);
    expectOk(keys);
    t.assert.deepStrictEqual(keys.value, ['world']);
  });

  it('asc({ offset: 1, limit: 0 }).keys should work', async (t: TestContext) => {
    const indexStore = objectStore.keys;

    expectOk(await objectStore.mutableObject('hello').create(trace, 3.14));
    expectOk(await objectStore.mutableObject('world').create(trace, 3.14));

    const keys = await indexStore.asc({ offset: 1, limit: 0 }).keys(trace);
    expectOk(keys);
    t.assert.deepStrictEqual(keys.value, []);
  });

  it('asc({ offset: 1, limit: 1 }).keys should work', async (t: TestContext) => {
    const indexStore = objectStore.keys;

    expectOk(await objectStore.mutableObject('hello').create(trace, 3.14));
    expectOk(await objectStore.mutableObject('world').create(trace, 3.14));

    const keys = await indexStore.asc({ offset: 1, limit: 1 }).keys(trace);
    expectOk(keys);
    t.assert.deepStrictEqual(keys.value, ['world']);
  });

  it('desc().keys should return all keys in reverse order', async (t: TestContext) => {
    const indexStore = objectStore.keys;

    expectOk(await objectStore.mutableObject('hello').create(trace, 3.14));
    expectOk(await objectStore.mutableObject('world').create(trace, 3.14));

    const keys = await indexStore.desc().keys(trace);
    expectOk(keys);
    t.assert.deepStrictEqual(keys.value, ['world', 'hello']);
  });

  it('desc({ offset: 1 }).keys should return all keys in reverse order', async (t: TestContext) => {
    const indexStore = objectStore.keys;

    expectOk(await objectStore.mutableObject('hello').create(trace, 3.14));
    expectOk(await objectStore.mutableObject('world').create(trace, 3.14));

    const keys = await indexStore.desc({ offset: 1 }).keys(trace);
    expectOk(keys);
    t.assert.deepStrictEqual(keys.value, ['hello']);
  });
});
