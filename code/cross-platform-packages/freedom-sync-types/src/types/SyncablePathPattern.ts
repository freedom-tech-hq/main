import type { DeserializationResult, SerializationResult } from 'yaschema';
import { schema } from 'yaschema';

import { syncableIdSchema } from './SyncableId.ts';
import type { SyncablePath } from './SyncablePath.ts';

export const syncableIdOrPatternSchema = schema.oneOf(syncableIdSchema, schema.string('*', '**'));
export type SyncableIdOrPattern = typeof syncableIdOrPatternSchema.valueType;

export class SyncablePathPattern {
  public readonly ids: Readonly<SyncableIdOrPattern[]>;

  constructor(...ids: SyncableIdOrPattern[]) {
    this.ids = ids;
  }

  /**
   * Creates a new `SyncablePathPattern` for the specified subPath (and any extra IDs) relative to the specified basePath.
   *
   * For example: `SyncablePathPattern.relativeTo(mySyncablePath, mySyncablePath.append(plainId('bundle', 'foo')), '*')` makes
   * `new SyncablePathPattern(plainId('bundle', 'foo'), '*')`
   */
  static relativeTo(basePath: SyncablePath, subPath: SyncablePath, ...ids: SyncableIdOrPattern[]) {
    return new SyncablePathPattern(...subPath.relativeTo(basePath)!, ...ids);
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
  serDes: {
    isValueType: (value): value is SyncablePathPattern => value instanceof SyncablePathPattern,
    serializedSchema: () => serializedSchema,
    serialize: (value): SerializationResult => serializedSchema.serialize({ ids: [...value.ids] }),
    deserialize: (value): DeserializationResult<SyncablePathPattern> => ({ deserialized: new SyncablePathPattern(...value.ids) })
  }
}) as schema.CustomSchema<SyncablePathPattern, Serialized>;
