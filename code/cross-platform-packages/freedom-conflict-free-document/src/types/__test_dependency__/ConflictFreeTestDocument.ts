/* node:coverage disable */

import type { EncodedConflictFreeDocumentSnapshot } from 'freedom-conflict-free-document-data';
import { schema } from 'yaschema';

import { ConflictFreeDocument } from '../ConflictFreeDocument.ts';

export const testMetaSchema = schema.object({ name: schema.string(), age: schema.number() });

export class ConflictFreeTestDocument extends ConflictFreeDocument<'TEST'> {
  constructor(snapshot?: { id: string; encoded: EncodedConflictFreeDocumentSnapshot<'TEST'> }) {
    super('TEST', snapshot);
  }

  // Overridden Public Methods

  public override clone(out?: ConflictFreeTestDocument): ConflictFreeTestDocument {
    return super.clone(out ?? new ConflictFreeTestDocument()) as ConflictFreeTestDocument;
  }

  // Field Access Methods

  public get title() {
    return this.generic.getTextField('title');
  }

  public get list() {
    return this.generic.getArrayField<string>('list', schema.string());
  }

  public get record() {
    return this.generic.getMapField<string, string>('record', schema.string());
  }

  public get enabled() {
    return this.generic.getBooleanField('enabled');
  }

  public get meta() {
    return this.generic.getObjectField('meta', testMetaSchema);
  }

  public get name() {
    return this.generic.getRestrictedTextField('name', '');
  }

  public get age() {
    return this.generic.getNumericField('age');
  }

  public get options() {
    return this.generic.getSetField<'label1' | 'label2' | 'label3'>('options');
  }
}
