import 'fake-indexeddb/auto';

import type { TestContext } from 'node:test';
import { afterEach, beforeEach, describe, it } from 'node:test';

import type { Trace } from 'freedom-contexts';
import { makeTrace, makeUuid } from 'freedom-contexts';
import { createOrGetObject } from 'freedom-object-store-types';
import { expectDeepStrictEqual, expectErrorCode, expectOk } from 'freedom-testing-tools';
import { schema } from 'yaschema';

import { getIndexedDb } from '../../utils/getIndexedDb.ts';
import { IndexedDbObjectStore } from '../IndexedDbObjectStore.ts';

const valueSchema = schema.number();

describe('IndexedDbObjectStore', () => {
  let trace: Trace;
  let db: IDBDatabase;
  let objectStore: IndexedDbObjectStore<string, number>;
  beforeEach(async () => {
    trace = makeTrace('test');
    try {
      const newDb = await getIndexedDb(trace, { dbName: `test-${makeUuid()}`, dbVersion: 1, storeName: 'my_objects' });
      expectOk(newDb);
      db = newDb.value;

      objectStore = new IndexedDbObjectStore({ db, schema: valueSchema, storeName: 'my_objects' });
    } catch (e) {
      console.log('BROKEN HERE', e);
    }
  });

  afterEach(async () => {
    db.close();
  });

  it('A conflict failure should be returned if trying to create an entry with a key that already exists', async (_t: TestContext) => {
    expectOk(await objectStore.mutableObject('a').create(trace, 3.14));

    expectErrorCode(await objectStore.mutableObject('a').create(trace, 6.28), 'conflict');
  });

  it('The stored value should be returned for createOrGet for entries with keys that already exist', async (t: TestContext) => {
    expectOk(await createOrGetObject(trace, objectStore.mutableObject('a'), 3.14));

    const found = await createOrGetObject(trace, objectStore.mutableObject('a'), 6.28);
    expectOk(found);
    t.assert.strictEqual(found.value, 3.14);
  });

  it('Deleting existing entries should work', async (t: TestContext) => {
    expectOk(await objectStore.mutableObject('a').create(trace, 3.14));

    expectOk(await objectStore.mutableObject('a').delete(trace));

    // Getting deleted keys and sweeping are no-ops with the IndexedDb backed object store because deletes are processed immediately
    const deletedKeys1 = await objectStore.getDeletedKeys(trace);
    expectOk(deletedKeys1);
    t.assert.deepStrictEqual(deletedKeys1.value.items, []);

    await objectStore.sweep(trace);

    const deletedKeys2 = await objectStore.getDeletedKeys(trace);
    expectOk(deletedKeys2);
    t.assert.strictEqual(deletedKeys2.value.items.length, 0);
  });

  it("A not-found failure should be returned if trying to delete an entry that doesn't exist", async (_t: TestContext) => {
    expectErrorCode(await objectStore.mutableObject('a').delete(trace), 'not-found');
  });

  it('Updating existing entries should work', async (t: TestContext) => {
    expectOk(await objectStore.mutableObject('a').create(trace, 3.14));

    const value1 = await objectStore.object('a').get(trace);
    expectOk(value1);
    t.assert.strictEqual(value1.value, 3.14);

    expectOk(await objectStore.mutableObject('a').update(trace, { storedValue: 6.28, updateCount: 0 }));

    const value2 = await objectStore.object('a').get(trace);
    expectOk(value2);
    t.assert.strictEqual(value2.value, 6.28);
  });

  it('An out-of-date failure should be returned if trying to update an existing entry with the wrong updateCount', async (t: TestContext) => {
    expectOk(await objectStore.mutableObject('a').create(trace, 3.14));

    const value1 = await objectStore.object('a').get(trace);
    expectOk(value1);
    t.assert.strictEqual(value1.value, 3.14);

    expectErrorCode(await objectStore.mutableObject('a').update(trace, { storedValue: 6.28, updateCount: 1 }), 'out-of-date');
  });

  it('get multiple should work', async () => {
    expectOk(await objectStore.mutableObject('a').create(trace, 3.14));
    expectOk(await objectStore.mutableObject('b').create(trace, 6.28));
    expectOk(await objectStore.mutableObject('c').create(trace, 9.42));

    const got = await objectStore.getMultiple(trace, ['a', 'b', 'c', 'd']);
    expectOk(got);
    expectDeepStrictEqual(got.value.found, { a: 3.14, b: 6.28, c: 9.42 });
    expectDeepStrictEqual(got.value.notFound, ['d']);
  });
});
