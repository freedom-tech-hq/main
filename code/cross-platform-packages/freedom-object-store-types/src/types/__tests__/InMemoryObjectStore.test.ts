import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { expectErrorCode, expectOk } from 'freedom-testing-tools';
import { schema } from 'yaschema';

import { createOrGetObject } from '../../tasks/createOrGetObject.ts';
import { InMemoryObjectStore } from '../InMemoryObjectStore.ts';

describe('InMemoryObjectStore', () => {
  it('A conflict failure should be returned if trying to create an entry with a key that already exists', async (_t: TestContext) => {
    const trace = makeTrace('test');

    const objectStore = new InMemoryObjectStore({ schema: valueSchema });

    expectOk(await objectStore.mutableObject('a').create(trace, 3.14));

    expectErrorCode(await objectStore.mutableObject('a').create(trace, 6.28), 'conflict');
  });

  it('The stored value should be returned for createOrGet for entries with keys that already exist', async (t: TestContext) => {
    const trace = makeTrace('test');

    const objectStore = new InMemoryObjectStore({ schema: valueSchema });

    expectOk(await createOrGetObject(trace, objectStore.mutableObject('a'), 3.14));

    const found = await createOrGetObject(trace, objectStore.mutableObject('a'), 6.28);
    expectOk(found);
    t.assert.strictEqual(found.value, 3.14);
  });

  it('Deleting existing entries should work', async (t: TestContext) => {
    const trace = makeTrace('test');

    const objectStore = new InMemoryObjectStore({ schema: valueSchema });

    expectOk(await objectStore.mutableObject('a').create(trace, 3.14));

    expectOk(await objectStore.mutableObject('a').delete(trace));

    const deletedKeys1 = await objectStore.getDeletedKeys(trace);
    expectOk(deletedKeys1);
    t.assert.deepStrictEqual(deletedKeys1.value.items, ['a']);

    await objectStore.sweep(trace);

    const deletedKeys2 = await objectStore.getDeletedKeys(trace);
    expectOk(deletedKeys2);
    t.assert.strictEqual(deletedKeys2.value.items.length, 0);
  });

  it("A not-found failure should be returned if trying to delete an entry that doesn't exist", async (_t: TestContext) => {
    const trace = makeTrace('test');

    const objectStore = new InMemoryObjectStore({ schema: valueSchema });

    expectErrorCode(await objectStore.mutableObject('a').delete(trace), 'not-found');
  });

  it('Updating existing entries should work', async (t: TestContext) => {
    const trace = makeTrace('test');

    const objectStore = new InMemoryObjectStore({ schema: valueSchema });

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
    const trace = makeTrace('test');

    const objectStore = new InMemoryObjectStore({ schema: valueSchema });

    expectOk(await objectStore.mutableObject('a').create(trace, 3.14));

    const value1 = await objectStore.object('a').get(trace);
    expectOk(value1);
    t.assert.strictEqual(value1.value, 3.14);

    expectErrorCode(await objectStore.mutableObject('a').update(trace, { storedValue: 6.28, updateCount: 1 }), 'out-of-date');
  });
});

// Helpers

const valueSchema = schema.number();
