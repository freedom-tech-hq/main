import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { ConflictFreeTestDocument } from '../__test_dependency__/ConflictFreeTestDocument.ts';

describe('ConflictFreeDocument', () => {
  describe('change listeners', () => {
    it('should work on documents', async (t: TestContext) => {
      const doc = new ConflictFreeTestDocument();

      let callCount = 0;
      const removeChangeListener = doc.addListener('change', () => {
        callCount += 1;
      });

      try {
        let expectedCallCount = 0;

        t.assert.strictEqual(callCount, expectedCallCount);
        doc.title.replace(0, 'hello');
        expectedCallCount += 2;
        t.assert.strictEqual(callCount, expectedCallCount); // 2 because the field is created and then modified

        doc.title.replace(5, ' world');
        expectedCallCount += 1;
        t.assert.strictEqual(callCount, expectedCallCount);

        doc.list.insert(0, ['hello']);
        expectedCallCount += 2;
        t.assert.strictEqual(callCount, expectedCallCount);

        await doc.asyncList.insert(0, ['hello2']);
        expectedCallCount += 2;
        t.assert.strictEqual(callCount, expectedCallCount);

        doc.record.set('hello', 'world');
        expectedCallCount += 2;
        t.assert.strictEqual(callCount, expectedCallCount);

        await doc.asyncRecord.set('hello2', 'world');
        expectedCallCount += 2;
        t.assert.strictEqual(callCount, expectedCallCount);

        doc.enabled.set(true);
        expectedCallCount += 2;
        t.assert.strictEqual(callCount, expectedCallCount);

        doc.name.set('test');
        expectedCallCount += 2;
        t.assert.strictEqual(callCount, expectedCallCount);

        doc.age.set(3.14);
        expectedCallCount += 2;
        t.assert.strictEqual(callCount, expectedCallCount);
      } finally {
        removeChangeListener();
      }
    });

    describe('should work on fields', () => {
      const doc = new ConflictFreeTestDocument();

      it('text', (t: TestContext) => {
        let callCount = 0;
        const removeChangeListener = doc.title.addListener('change', ({ fieldName }) => {
          t.assert.strictEqual(fieldName, 'title');
          callCount += 1;
        });

        try {
          t.assert.strictEqual(callCount, 0);
          doc.title.replace(0, 'hello');
          t.assert.strictEqual(callCount, 1);
          doc.title.replace(5, ' world');
          t.assert.strictEqual(callCount, 2);
        } finally {
          removeChangeListener();
        }
      });

      it('array', (t: TestContext) => {
        let callCount = 0;
        const removeChangeListener = doc.list.addListener('change', ({ fieldName }) => {
          t.assert.strictEqual(fieldName, 'list');
          callCount += 1;
        });

        try {
          t.assert.strictEqual(callCount, 0);
          doc.list.insert(0, ['hello']);
          t.assert.strictEqual(callCount, 1);
          doc.list.insert(1, ['world']);
          t.assert.strictEqual(callCount, 2);
        } finally {
          removeChangeListener();
        }
      });

      it('asyncArray', async (t: TestContext) => {
        let callCount = 0;
        const removeChangeListener = doc.asyncList.addListener('change', ({ fieldName }) => {
          t.assert.strictEqual(fieldName, 'asyncList');
          callCount += 1;
        });

        try {
          t.assert.strictEqual(callCount, 0);
          await doc.asyncList.insert(0, ['hello']);
          t.assert.strictEqual(callCount, 1);
          await doc.asyncList.insert(1, ['world']);
          t.assert.strictEqual(callCount, 2);
        } finally {
          removeChangeListener();
        }
      });

      it('map', (t: TestContext) => {
        let callCount = 0;
        const removeChangeListener = doc.record.addListener('change', ({ fieldName }) => {
          t.assert.strictEqual(fieldName, 'record');
          callCount += 1;
        });

        try {
          t.assert.strictEqual(callCount, 0);
          doc.record.set('hello', 'world');
          t.assert.strictEqual(callCount, 1);
          doc.record.set('one', 'ONE');
          t.assert.strictEqual(callCount, 2);
        } finally {
          removeChangeListener();
        }
      });

      it('asyncMap', async (t: TestContext) => {
        let callCount = 0;
        const removeChangeListener = doc.asyncRecord.addListener('change', ({ fieldName }) => {
          t.assert.strictEqual(fieldName, 'asyncRecord');
          callCount += 1;
        });

        try {
          t.assert.strictEqual(callCount, 0);
          await doc.asyncRecord.set('hello', 'world');
          t.assert.strictEqual(callCount, 1);
          await doc.asyncRecord.set('one', 'ONE');
          t.assert.strictEqual(callCount, 2);
        } finally {
          removeChangeListener();
        }
      });

      it('object', (t: TestContext) => {
        let callCount = 0;
        const removeChangeListener = doc.meta.addListener('change', ({ fieldName }) => {
          t.assert.strictEqual(fieldName, 'meta');
          callCount += 1;
        });

        try {
          t.assert.strictEqual(callCount, 0);
          t.assert.strictEqual(doc.meta.get(), undefined);

          doc.meta.set({ name: 'Test', age: 25 });
          t.assert.strictEqual(callCount, 1);
          t.assert.deepStrictEqual(doc.meta.get(), { name: 'Test', age: 25 });

          doc.meta.set({ name: 'Test2', age: 26 });
          t.assert.strictEqual(callCount, 3); // Replacing an existing value is a delete + a set

          doc.meta.set(undefined);
          t.assert.strictEqual(callCount, 4);
          t.assert.strictEqual(doc.meta.get(), undefined);
        } finally {
          removeChangeListener();
        }
      });

      it('asyncObject', async (t: TestContext) => {
        let callCount = 0;
        const removeChangeListener = doc.asyncMeta.addListener('change', ({ fieldName }) => {
          t.assert.strictEqual(fieldName, 'asyncMeta');
          callCount += 1;
        });

        try {
          t.assert.strictEqual(callCount, 0);
          t.assert.strictEqual(await doc.asyncMeta.get(), undefined);

          await doc.asyncMeta.set({ name: 'Test', age: 25 });
          t.assert.strictEqual(callCount, 1);
          t.assert.deepStrictEqual(await doc.asyncMeta.get(), { name: 'Test', age: 25 });

          await doc.asyncMeta.set({ name: 'Test2', age: 26 });
          t.assert.strictEqual(callCount, 3); // Replacing an existing value is a delete + a set

          await doc.asyncMeta.set(undefined);
          t.assert.strictEqual(callCount, 4);
          t.assert.strictEqual(await doc.asyncMeta.get(), undefined);
        } finally {
          removeChangeListener();
        }
      });

      it('boolean', (t: TestContext) => {
        let callCount = 0;
        const removeChangeListener = doc.enabled.addListener('change', ({ fieldName }) => {
          t.assert.strictEqual(fieldName, 'enabled');
          callCount += 1;
        });

        try {
          t.assert.strictEqual(callCount, 0);
          doc.enabled.set(true);
          t.assert.strictEqual(callCount, 1);
          doc.enabled.set(false);
          t.assert.strictEqual(callCount, 2);
        } finally {
          removeChangeListener();
        }
      });

      it('restrictedText', (t: TestContext) => {
        let callCount = 0;
        const removeChangeListener = doc.name.addListener('change', ({ fieldName }) => {
          t.assert.strictEqual(fieldName, 'name');
          callCount += 1;
        });

        try {
          t.assert.strictEqual(callCount, 0);
          doc.name.set('test');
          t.assert.strictEqual(callCount, 1);
          doc.name.set('TEST');
          t.assert.strictEqual(callCount, 3); // Really a delete + insert
        } finally {
          removeChangeListener();
        }
      });

      it('numeric', (t: TestContext) => {
        let callCount = 0;
        const removeChangeListener = doc.age.addListener('change', ({ fieldName }) => {
          t.assert.strictEqual(fieldName, 'age');
          callCount += 1;
        });

        try {
          t.assert.strictEqual(callCount, 0);
          doc.age.set(3.14);
          t.assert.strictEqual(callCount, 1);
          doc.age.set(6.28);
          t.assert.strictEqual(callCount, 3); // Really a delete + insert
        } finally {
          removeChangeListener();
        }
      });

      it('set', (t: TestContext) => {
        t.assert.strictEqual(doc.options.getSize(), 0);
        doc.options.clear();
        t.assert.strictEqual(doc.options.getSize(), 0);

        let callCount = 0;
        const removeChangeListener = doc.options.addListener('change', ({ fieldName }) => {
          t.assert.strictEqual(fieldName, 'options');
          callCount += 1;
        });

        try {
          t.assert.strictEqual(callCount, 0);
          doc.options.add('label1');
          t.assert.strictEqual(callCount, 1);
          doc.options.add('label2');
          t.assert.strictEqual(callCount, 2);
          doc.options.add('label1');
          t.assert.strictEqual(callCount, 2);

          t.assert.strictEqual(doc.options.has('label1'), true);
          t.assert.strictEqual(doc.options.has('label2'), true);
          doc.options.delete('label1');
          t.assert.strictEqual(doc.options.has('label1'), false);
          t.assert.strictEqual(doc.options.getSize(), 1);

          doc.options.add('label1', 'label2', 'label3');
          t.assert.strictEqual(callCount, 5);
        } finally {
          removeChangeListener();
        }

        t.assert.strictEqual(doc.options.getSize(), 3);
        doc.options.clear();
        t.assert.strictEqual(doc.options.getSize(), 0);
      });
    });
  });

  describe('clone', () => {
    it('should work', (t: TestContext) => {
      const doc = new ConflictFreeTestDocument();
      doc.title.replace(0, 'hello');

      const doc2 = doc.clone();
      t.assert.strictEqual(doc2.title.getString(), 'hello');
    });
  });

  describe('snapshots', () => {
    it('regular snapshots should work', (t: TestContext) => {
      const doc = new ConflictFreeTestDocument();
      doc.title.replace(0, 'hello');
      const snapshotId = 'test-snapshot-id';
      const encodedSnapshot = doc.encodeSnapshot(snapshotId);

      const doc2 = new ConflictFreeTestDocument({ id: snapshotId, encoded: encodedSnapshot });
      t.assert.strictEqual(doc2.title.getString(), 'hello');
    });

    it('flattened snapshots should work', async (t: TestContext) => {
      const doc = new ConflictFreeTestDocument();
      doc.title.replace(0, 'hello');
      doc.list.insert(0, ['hello']);
      await doc.asyncList.insert(0, ['hello2']);
      doc.record.set('hello', 'world');
      await doc.asyncRecord.set('hello2', 'world');
      doc.enabled.set(true);
      doc.name.set('test');
      doc.age.set(3.14);
      doc.options.add('label1');

      const snapshotId = 'test-snapshot-id';
      const encodedSnapshot = doc.encodeFlattenedSnapshot(snapshotId);

      const doc2 = new ConflictFreeTestDocument({ id: snapshotId, encoded: encodedSnapshot });
      t.assert.strictEqual(doc2.title.getString(), 'hello');
      t.assert.deepStrictEqual(Array.from(doc2.list.entries()), [[0, 'hello']]);
      t.assert.deepStrictEqual(await resolveArrayEntries(doc2.asyncList.entries()), [[0, 'hello2']]);
      t.assert.deepStrictEqual(Array.from(doc2.record.entries()), [['hello', 'world']]);
      t.assert.deepStrictEqual(await resolveMapEntries(doc2.asyncRecord.entries()), [['hello2', 'world']]);
      t.assert.strictEqual(doc2.enabled.get(), true);
      t.assert.strictEqual(doc2.name.get(), 'test');
      t.assert.strictEqual(doc2.age.get(), 3.14);
      t.assert.deepStrictEqual(Array.from(doc2.options.iterator()).sort(), ['label1']);
    });
  });

  describe('deltas', () => {
    it('regular deltas should work', (t: TestContext) => {
      const doc = new ConflictFreeTestDocument();
      doc.title.replace(0, 'hello');

      const doc2 = doc.clone();

      doc.title.replace(5, ' world');
      doc.age.set(6.28);
      doc.meta.set({ name: 'Testing', age: 25 });

      t.assert.strictEqual(doc2.title.getString(), 'hello');

      const delta = doc.encodeDelta();
      doc2.applyDeltas([delta]);

      t.assert.strictEqual(doc2.title.getString(), 'hello world');
      t.assert.strictEqual(doc2.age.get(), 6.28);
      t.assert.deepStrictEqual(doc2.meta.get(), { name: 'Testing', age: 25 });
    });

    it('diff should work', (t: TestContext) => {
      const doc = new ConflictFreeTestDocument();
      doc.title.replace(0, 'hello');

      const doc2 = doc.clone();

      doc.title.replace(5, ' world');

      t.assert.strictEqual(doc2.title.getString(), 'hello');

      const delta = doc2.diff(doc);
      doc2.applyDeltas([delta]);

      t.assert.strictEqual(doc2.title.getString(), 'hello world');
    });

    it('merge should work', (t: TestContext) => {
      const doc = new ConflictFreeTestDocument();
      doc.title.replace(0, 'hello');

      const doc2 = doc.clone();

      doc.title.replace(5, ' world');

      t.assert.strictEqual(doc2.title.getString(), 'hello');

      doc2.merge(doc);

      t.assert.strictEqual(doc2.title.getString(), 'hello world');
    });

    it('apply should work in any order for text', (t: TestContext) => {
      const doc = new ConflictFreeTestDocument();

      doc.title.replace(0, 'hello');
      const delta1 = doc.encodeDelta();
      doc.title.replace(5, ' world');
      const delta2 = doc.encodeDelta();
      doc.title.replace([3, 9], 'LO WOR');
      const delta3 = doc.encodeDelta();
      doc.title.replace(0, 'HOWDY ');
      const delta4 = doc.encodeDelta();

      {
        const doc2 = new ConflictFreeTestDocument();
        doc2.applyDeltas([delta1, delta2, delta3, delta4]);
        t.assert.strictEqual(doc2.title.getString(), 'HOWDY helLO WORld');
      }
      {
        const doc2 = new ConflictFreeTestDocument();
        doc2.applyDeltas([delta4, delta3, delta2, delta1]);
        t.assert.strictEqual(doc2.title.getString(), 'HOWDY helLO WORld');
      }
      {
        const doc2 = new ConflictFreeTestDocument();
        doc2.applyDeltas([delta2, delta1, delta4, delta3]);
        t.assert.strictEqual(doc2.title.getString(), 'HOWDY helLO WORld');
      }
      {
        const doc2 = new ConflictFreeTestDocument();
        doc2.applyDeltas([delta3, delta4, delta1, delta2]);
        t.assert.strictEqual(doc2.title.getString(), 'HOWDY helLO WORld');
      }
    });

    it('apply should work in any order for array elements', (t: TestContext) => {
      const doc = new ConflictFreeTestDocument();
      doc.list.append(['hello']);
      const delta1 = doc.encodeDelta();
      doc.list.append(['world']);
      const delta2 = doc.encodeDelta();
      doc.list.insert(1, ['HELLO']);
      const delta3 = doc.encodeDelta();
      doc.list.insert(0, ['HOWDY']);
      const delta4 = doc.encodeDelta();

      {
        const doc2 = new ConflictFreeTestDocument();
        doc2.applyDeltas([delta1, delta2, delta3, delta4]);
        t.assert.deepStrictEqual(Array.from(doc2.list.values()), ['HOWDY', 'hello', 'HELLO', 'world']);
      }
      {
        const doc2 = new ConflictFreeTestDocument();
        doc2.applyDeltas([delta4, delta3, delta2, delta1]);
        t.assert.deepStrictEqual(Array.from(doc2.list.values()), ['HOWDY', 'hello', 'HELLO', 'world']);
      }
      {
        const doc2 = new ConflictFreeTestDocument();
        doc2.applyDeltas([delta2]);
        doc2.applyDeltas([delta1]);
        doc2.applyDeltas([delta4]);
        doc2.applyDeltas([delta3]);
        t.assert.deepStrictEqual(Array.from(doc2.list.values()), ['HOWDY', 'hello', 'HELLO', 'world']);
      }
      {
        const doc2 = new ConflictFreeTestDocument();
        doc2.applyDeltas([delta3, delta4, delta1, delta2]);
        t.assert.deepStrictEqual(Array.from(doc2.list.values()), ['HOWDY', 'hello', 'HELLO', 'world']);
      }
    });
  });

  describe('getting field names', () => {
    it('should work', async (t: TestContext) => {
      const doc = new ConflictFreeTestDocument();
      t.assert.deepStrictEqual(Array.from(doc.generic.getArrayFieldNames()).sort(), []);
      t.assert.deepStrictEqual(Array.from(doc.generic.getTextFieldNames()).sort(), []);
      t.assert.deepStrictEqual(Array.from(doc.generic.getMapFieldNames()).sort(), []);
      t.assert.deepStrictEqual(Array.from(doc.generic.getBooleanFieldNames()).sort(), []);
      t.assert.deepStrictEqual(Array.from(doc.generic.getRestrictedTextFieldNames()).sort(), []);
      t.assert.deepStrictEqual(Array.from(doc.generic.getNumericFieldNames()).sort(), []);
      t.assert.deepStrictEqual(Array.from(doc.generic.getSetFieldNames()).sort(), []);

      doc.title.replace(0, 'hello');
      doc.list.insert(0, ['hello']);
      await doc.asyncList.insert(0, ['hello2']);
      doc.record.set('hello', 'world');
      await doc.asyncRecord.set('hello2', 'world');
      doc.enabled.set(true);
      doc.name.set('test');
      doc.age.set(3.14);
      doc.options.add('label1');

      t.assert.deepStrictEqual(Array.from(doc.generic.getArrayFieldNames()).sort(), ['asyncList', 'list']);
      t.assert.deepStrictEqual(Array.from(doc.generic.getTextFieldNames()).sort(), ['title']);
      t.assert.deepStrictEqual(Array.from(doc.generic.getMapFieldNames()).sort(), ['asyncRecord', 'record']);
      t.assert.deepStrictEqual(Array.from(doc.generic.getBooleanFieldNames()).sort(), ['enabled']);
      t.assert.deepStrictEqual(Array.from(doc.generic.getRestrictedTextFieldNames()).sort(), ['name']);
      t.assert.deepStrictEqual(Array.from(doc.generic.getNumericFieldNames()).sort(), ['age']);
      t.assert.deepStrictEqual(Array.from(doc.generic.getSetFieldNames()).sort(), ['options']);
    });
  });

  describe('arrays', () => {
    it('sync should work', (t: TestContext) => {
      const doc = new ConflictFreeTestDocument();
      t.assert.strictEqual(doc.list.getLength(), 0);
      doc.list.insert(0, ['hello', 'world']);
      t.assert.strictEqual(doc.list.getLength(), 2);
    });

    it('async should work', async (t: TestContext) => {
      const doc = new ConflictFreeTestDocument();
      t.assert.strictEqual(doc.asyncList.getLength(), 0);
      await doc.asyncList.insert(0, ['hello', 'world']);
      t.assert.strictEqual(doc.asyncList.getLength(), 2);
    });
  });
});

// Helpers

const resolveArrayEntries = async <T>(entries: IterableIterator<[number, Promise<T>]>): Promise<Array<[number, T]>> => {
  const output: Array<[number, T]> = [];
  for (const [key, promisedValue] of entries) {
    output.push([key, await promisedValue]);
  }
  return output;
};

const resolveMapEntries = async <K extends string, T>(entries: IterableIterator<[K, Promise<T>]>): Promise<Array<[K, T]>> => {
  const output: Array<[K, T]> = [];
  for (const [key, promisedValue] of entries) {
    output.push([key, await promisedValue]);
  }
  return output;
};
