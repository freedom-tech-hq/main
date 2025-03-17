import { isEqual } from 'lodash-es';
import { schema } from 'yaschema';

import { DynamicSyncablePath } from './DynamicSyncablePath.ts';
import type { StorageRootId } from './StorageRootId.ts';
import { storageRootIdInfo } from './StorageRootId.ts';
import type { SyncableId } from './SyncableId.ts';
import { syncableIdSchema } from './SyncableId.ts';

export class StaticSyncablePath {
  public readonly storageRootId: StorageRootId;
  public readonly ids: Readonly<SyncableId[]>;

  constructor(storageRootId: StorageRootId, ...ids: SyncableId[]) {
    this.storageRootId = storageRootId;
    this.ids = ids;
  }

  /** Returns a new path with an appended ID */
  public append(...ids: SyncableId[]) {
    return new StaticSyncablePath(this.storageRootId, ...this.ids, ...ids);
  }

  public get dynamic() {
    return new DynamicSyncablePath(this.storageRootId, ...this.ids);
  }

  /** Returns a new path one level up.  For the root path, this returns `undefined`. */
  public get parentPath(): StaticSyncablePath | undefined {
    if (this.ids.length === 0) {
      return undefined;
    } else {
      return new StaticSyncablePath(this.storageRootId, ...this.ids.slice(0, this.ids.length - 1));
    }
  }

  public get lastId(): SyncableId | undefined {
    return this.ids[this.ids.length - 1];
  }

  public isEqual(anotherPath: StaticSyncablePath) {
    return this.storageRootId === anotherPath.storageRootId && isEqual(this.ids, anotherPath.ids);
  }

  public toString() {
    return `${encodeURIComponent(this.storageRootId)}:/${this.ids.map(encodeURIComponent).join('/')}`;
  }
}

const serializedSchema = schema.object({
  storageRootId: storageRootIdInfo.schema,
  ids: schema.array({ items: syncableIdSchema })
});
type Serialized = typeof serializedSchema.valueType;
export const syncablePathSchema = schema.custom<StaticSyncablePath, Serialized>({
  typeName: 'StaticSyncablePath',
  isContainerType: true,
  serDes: {
    isValueType: (value): value is StaticSyncablePath => value instanceof StaticSyncablePath,
    serializedSchema: () => serializedSchema,
    serialize: (value) => serializedSchema.serializeAsync({ storageRootId: value.storageRootId, ids: [...value.ids] }),
    deserialize: (value) => ({ deserialized: new StaticSyncablePath(value.storageRootId, ...value.ids) })
  }
}) as schema.CustomSchema<StaticSyncablePath, Serialized>;
