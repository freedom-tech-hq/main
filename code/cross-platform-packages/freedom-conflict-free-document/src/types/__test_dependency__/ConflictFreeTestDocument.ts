/* node:coverage disable */

import type { EncodedConflictFreeDocumentSnapshot } from 'freedom-conflict-free-document-data';
import { sleep } from 'freedom-testing-tools';
import { schema } from 'yaschema';

import { ConflictFreeDocument } from '../ConflictFreeDocument.ts';

const asyncStringSchema = schema.custom<string, string>({
  typeName: 'AsyncString',
  serDes: {
    deserialize: async (value) => {
      await sleep(50);
      return { deserialized: value };
    },
    isValueType: (value) => typeof value === 'string',
    serialize: async (value) => {
      await sleep(50);
      return { serialized: value };
    },
    serializedSchema: () => schema.string()
  }
});

const testMetaSchema = schema.object({ name: schema.string(), age: schema.number() });
const testAsyncMetaSchema = schema.object({ name: asyncStringSchema, age: schema.number() });

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

  public get asyncList() {
    return this.generic.getAsyncArrayField<string>('asyncList', asyncStringSchema);
  }

  public get record() {
    return this.generic.getMapField<string, string>('record', schema.string());
  }

  public get asyncRecord() {
    return this.generic.getAsyncMapField<string, string>('asyncRecord', asyncStringSchema);
  }

  public get enabled() {
    return this.generic.getBooleanField('enabled');
  }

  public get meta() {
    return this.generic.getObjectField('meta', testMetaSchema);
  }

  public get asyncMeta() {
    return this.generic.getAsyncObjectField('asyncMeta', testAsyncMetaSchema);
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
