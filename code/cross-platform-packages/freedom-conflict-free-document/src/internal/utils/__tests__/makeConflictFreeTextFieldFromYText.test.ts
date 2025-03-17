import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import * as Y from 'yjs';

import { makeConflictFreeDocumentFieldInfos } from '../makeConflictFreeDocumentFieldInfos.ts';
import { makeConflictFreeTextFieldFromYText } from '../makeConflictFreeTextFieldFromYText.ts';

describe('makeConflictFreeTextFieldFromYText', () => {
  describe('replace', () => {
    it('inserting into an empty text field should work', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfText = makeConflictFreeTextFieldFromYText(yDoc, fieldInfos, 'content');
      cfText.replace(0, 'Hello World', { bold: true });
      t.assert.strictEqual(cfText.getString(), 'Hello World');
      t.assert.deepStrictEqual(cfText.getTextFragments(), [{ text: 'Hello World', attributes: { bold: true } }]);
    });

    it('inserting at the beginning of a document should work', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfText = makeConflictFreeTextFieldFromYText(yDoc, fieldInfos, 'content');
      cfText.replace(0, 'Hello World', { bold: true });
      cfText.replace(0, '[PREFIX]', { italic: true });

      t.assert.strictEqual(cfText.getString(), '[PREFIX]Hello World');
      t.assert.deepStrictEqual(cfText.getTextFragments(), [
        { text: '[PREFIX]', attributes: { italic: true } },
        { text: 'Hello World', attributes: { bold: true } }
      ]);
    });

    it('inserting at the end of a document should work', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfText = makeConflictFreeTextFieldFromYText(yDoc, fieldInfos, 'content');
      cfText.replace(0, 'Hello World', { bold: true });
      cfText.replace(cfText.getLength(), '[SUFFIX]', { italic: true });

      t.assert.strictEqual(cfText.getString(), 'Hello World[SUFFIX]');
      t.assert.deepStrictEqual(cfText.getTextFragments(), [
        { text: 'Hello World', attributes: { bold: true } },
        { text: '[SUFFIX]', attributes: { italic: true } }
      ]);
    });

    it('replacing text in the middle of a document should work', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfText = makeConflictFreeTextFieldFromYText(yDoc, fieldInfos, 'content');
      cfText.replace(0, 'Hello World', { bold: true });
      cfText.replace([3, 7], '[MIDDLE]', { italic: true });

      t.assert.strictEqual(cfText.getString(), 'Hel[MIDDLE]orld');
      t.assert.deepStrictEqual(cfText.getTextFragments(), [
        { text: 'Hel', attributes: { bold: true } },
        { text: '[MIDDLE]', attributes: { italic: true } },
        { text: 'orld', attributes: { bold: true } }
      ]);
    });

    it('replacing text at the beginning of a document should work', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfText = makeConflictFreeTextFieldFromYText(yDoc, fieldInfos, 'content');
      cfText.replace(0, 'Hello World', { bold: true });
      cfText.replace([0, 5], '[X]', { italic: true });

      t.assert.strictEqual(cfText.getString(), '[X] World');
      t.assert.deepStrictEqual(cfText.getTextFragments(), [
        { text: '[X]', attributes: { italic: true } },
        { text: ' World', attributes: { bold: true } }
      ]);
    });

    it('replacing text at the end of a document should work', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfText = makeConflictFreeTextFieldFromYText(yDoc, fieldInfos, 'content');
      cfText.replace(0, 'Hello World', { bold: true });
      cfText.replace([cfText.getLength() - 5, undefined], '[X]', { italic: true });

      t.assert.strictEqual(cfText.getString(), 'Hello [X]');
      t.assert.deepStrictEqual(cfText.getTextFragments(), [
        { text: 'Hello ', attributes: { bold: true } },
        { text: '[X]', attributes: { italic: true } }
      ]);
    });

    it('replacing all the text of a document should work', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfText = makeConflictFreeTextFieldFromYText(yDoc, fieldInfos, 'content');
      cfText.replace(0, 'Hello World', { bold: true });
      cfText.replace([0, cfText.getLength()], '[X]', { italic: true });

      t.assert.strictEqual(cfText.getString(), '[X]');
      t.assert.deepStrictEqual(cfText.getTextFragments(), [{ text: '[X]', attributes: { italic: true } }]);
    });

    it('replacing only attributes should work', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfText = makeConflictFreeTextFieldFromYText(yDoc, fieldInfos, 'content');
      cfText.replace(0, 'Hello World', { bold: true });
      cfText.replace(cfText.getLength(), ' Goodbye', { italic: true });
      cfText.replace([3, 7], undefined, { bold: false });

      t.assert.strictEqual(cfText.getString(), 'Hello World Goodbye');
      t.assert.deepStrictEqual(cfText.getTextFragments(), [
        { text: 'Hel', attributes: { bold: true } },
        { text: 'lo W', attributes: { bold: false } },
        { text: 'orld', attributes: { bold: true } },
        { text: ' Goodbye', attributes: { italic: true } }
      ]);
    });
  });

  describe('delete', () => {
    it('deleting text from the beginning should work', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfText = makeConflictFreeTextFieldFromYText(yDoc, fieldInfos, 'content');
      cfText.replace(0, 'Hello World', { bold: true });
      cfText.delete(0, 6);
      t.assert.strictEqual(cfText.getString(), 'World');
      t.assert.deepStrictEqual(cfText.getTextFragments(), [{ text: 'World', attributes: { bold: true } }]);
    });

    it('deleting text from the middle should work', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfText = makeConflictFreeTextFieldFromYText(yDoc, fieldInfos, 'content');
      cfText.replace(0, 'Hello World', { bold: true });
      cfText.delete(3, 7);
      t.assert.strictEqual(cfText.getString(), 'Helorld');
      t.assert.deepStrictEqual(cfText.getTextFragments(), [{ text: 'Helorld', attributes: { bold: true } }]);
    });

    it('deleting text from the end should work', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfText = makeConflictFreeTextFieldFromYText(yDoc, fieldInfos, 'content');
      cfText.replace(0, 'Hello World', { bold: true });
      cfText.delete(cfText.getLength() - 6);
      t.assert.strictEqual(cfText.getString(), 'Hello');
      t.assert.deepStrictEqual(cfText.getTextFragments(), [{ text: 'Hello', attributes: { bold: true } }]);
    });

    it('deleting all text should work', (t: TestContext) => {
      const yDoc = new Y.Doc();
      const fieldInfos = makeConflictFreeDocumentFieldInfos();

      const cfText = makeConflictFreeTextFieldFromYText(yDoc, fieldInfos, 'content');
      cfText.replace(0, 'Hello World', { bold: true });
      cfText.delete(0, cfText.getLength());
      t.assert.strictEqual(cfText.getString(), '');
      t.assert.deepStrictEqual(cfText.getTextFragments(), []);
    });
  });
});
