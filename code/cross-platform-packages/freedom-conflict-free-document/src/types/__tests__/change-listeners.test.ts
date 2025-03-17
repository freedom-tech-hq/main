import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { ConflictFreeDocument } from '../ConflictFreeDocument.ts';

describe('makeChangeListenerSupportForConflictFreeDocumentField', () => {
  it('inserting into an empty text field should work', (t: TestContext) => {
    const doc = new ConflictFreeDocument('');

    let docChangeCount = 0;
    doc.addListener('change', () => {
      docChangeCount += 1;
    });

    t.assert.strictEqual(docChangeCount, 0);

    const counter = doc.generic.getNumericField('counter');

    let fieldChangeCount = 0;
    counter.addListener('change', () => {
      fieldChangeCount += 1;
    });

    t.assert.strictEqual(docChangeCount, 1); // When field is added
    t.assert.strictEqual(fieldChangeCount, 0);

    counter.set(counter.get() + 1);

    t.assert.strictEqual(docChangeCount, 2); // New value is inserted (no previous value, so no deletion change)
    t.assert.strictEqual(fieldChangeCount, 1); // New value is inserted (no previous value, so no deletion change)

    counter.set(counter.get() + 1);

    t.assert.strictEqual(docChangeCount, 4); // Previous value is deleted and then the new value is inserted
    t.assert.strictEqual(fieldChangeCount, 3); // Previous value is deleted and then the new value is inserted
  });
});
