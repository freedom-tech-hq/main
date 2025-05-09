import type { DeserializationResult, SerializationResult } from 'yaschema';
import { schema } from 'yaschema';

import { syncableIdSchema } from './SyncableId.ts';

export const syncableIdOrPatternSchema = schema.oneOf(syncableIdSchema, schema.string('*', '**'));
export type SyncableIdOrPattern = typeof syncableIdOrPatternSchema.valueType;

export class SyncablePathPattern {
  public readonly ids: Readonly<SyncableIdOrPattern[]>;

  constructor(...ids: SyncableIdOrPattern[]) {
    this.ids = ids;
  }

  /** Returns a new path with an appended ID */
  public append(...ids: SyncableIdOrPattern[]) {
    return new SyncablePathPattern(...this.ids, ...ids);
  }

  public toString() {
    return `${this.ids.map(encodeURIComponent).join('/')}`;
  }
}

const serializedSchema = schema.object({
  ids: schema.array({ items: syncableIdOrPatternSchema })
});
type Serialized = typeof serializedSchema.valueType;
export const syncablePathPatternSchema = schema.custom<SyncablePathPattern, Serialized>({
  typeName: 'SyncablePathPattern',
  isContainerType: false,
  serDes: {
    isValueType: (value): value is SyncablePathPattern => value instanceof SyncablePathPattern,
    serializedSchema: () => serializedSchema,
    serialize: (value): SerializationResult => serializedSchema.serialize({ ids: [...value.ids] }),
    deserialize: (value): DeserializationResult<SyncablePathPattern> => ({ deserialized: new SyncablePathPattern(...value.ids) })
  }
}) as schema.CustomSchema<SyncablePathPattern, Serialized>;
