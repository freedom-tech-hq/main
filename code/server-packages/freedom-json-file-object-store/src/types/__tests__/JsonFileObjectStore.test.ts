import os from 'node:os';
import path from 'node:path';
import type { TestContext } from 'node:test';
import { beforeEach, describe, it } from 'node:test';

import type { Trace } from 'freedom-contexts';
import { makeTrace, makeUuid } from 'freedom-contexts';
import { createOrGetObject } from 'freedom-object-store-types';
import { expectDeepStrictEqual, expectErrorCode, expectOk, expectStrictEqual } from 'freedom-testing-tools';
import { schema } from 'yaschema';

import { JsonFileObjectStore } from '../JsonFileObjectStore.ts';

const valueSchema = schema.number();

describe('JsonFileObjectStore', () => {
  let trace: Trace;
  let jsonFilePath: string;
  let objectStore: JsonFileObjectStore<string, number>;
  beforeEach(async () => {
    trace = makeTrace('test');

    jsonFilePath = path.join(os.tmpdir(), `testing-${makeUuid()}.json`);
    console.log('jsonFilePath', jsonFilePath);
    objectStore = new JsonFileObjectStore({ path: jsonFilePath, schema: valueSchema });
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

  it('Deleting existing entries should work', async (_t: TestContext) => {
    expectOk(await objectStore.mutableObject('a').create(trace, 3.14));

    expectOk(await objectStore.mutableObject('a').delete(trace));

    expectErrorCode(await objectStore.mutableObject('a').get(trace), 'not-found');
  });

  it('Exists should work', async (_t: TestContext) => {
    const aExists1 = await objectStore.object('a').exists(trace);
    expectOk(aExists1);
    expectStrictEqual(aExists1.value, false);

    expectOk(await objectStore.mutableObject('a').create(trace, 3.14));

    const aExists2 = await objectStore.object('a').exists(trace);
    expectOk(aExists2);
    expectStrictEqual(aExists2.value, true);
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

  it('Updating existing entries should work with getMutable', async (t: TestContext) => {
    expectOk(await objectStore.mutableObject('a').create(trace, 3.14));

    const value1 = await objectStore.mutableObject('a').getMutable(trace);
    expectOk(value1);
    t.assert.strictEqual(value1.value.storedValue, 3.14);
    t.assert.strictEqual(value1.value.updateCount, 0);

    expectOk(await objectStore.mutableObject('a').update(trace, { storedValue: 6.28, updateCount: value1.value.updateCount }));

    const value2 = await objectStore.object('a').get(trace);
    expectOk(value2);
    t.assert.strictEqual(value2.value, 6.28);
  });

  // We don't have such field in the persisted data. DB migration is not implemented.
  it.skip('An out-of-date failure should be returned if trying to update an existing entry with the wrong updateCount', async (t: TestContext) => {
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
