import { isEqual } from 'lodash-es';
import type { DeserializationResult, SerializationResult } from 'yaschema';
import { schema } from 'yaschema';

import type { StorageRootId } from './StorageRootId.ts';
import { storageRootIdInfo } from './StorageRootId.ts';
import type { SyncableId } from './SyncableId.ts';
import { syncableIdSchema } from './SyncableId.ts';

export class SyncablePath {
  public readonly storageRootId: StorageRootId;
  public readonly ids: Readonly<SyncableId[]>;

  constructor(storageRootId: StorageRootId, ...ids: SyncableId[]) {
    this.storageRootId = storageRootId;
    this.ids = ids;
  }

  /** Returns a new path with an appended ID */
  public append(...ids: SyncableId[]) {
    return new SyncablePath(this.storageRootId, ...this.ids, ...ids);
  }

  /** Returns a new path one level up.  For the root path, this returns `undefined`. */
  public get parentPath(): SyncablePath | undefined {
    if (this.ids.length === 0) {
      return undefined;
    } else {
      return new SyncablePath(this.storageRootId, ...this.ids.slice(0, this.ids.length - 1));
    }
  }

  public get lastId(): SyncableId | undefined {
    return this.ids[this.ids.length - 1];
  }

  public isEqual(anotherPath: SyncablePath) {
    return this.storageRootId === anotherPath.storageRootId && isEqual(this.ids, anotherPath.ids);
  }

  /** Checks if the specified path is equal to or is an ancestor of this path */
  public startsWith(anotherPath: SyncablePath) {
    if (this.storageRootId !== anotherPath.storageRootId) {
      return false;
    }

    let index = 0;
    for (const id of anotherPath.ids) {
      if (this.ids[index] !== id) {
        return false;
      }

      index += 1;
    }

    return true;
  }

  public relativeTo(basePath: SyncablePath): SyncableId[] | undefined {
    if (!this.startsWith(basePath)) {
      return undefined;
    }

    return this.ids.slice(basePath.ids.length);
  }

  public toRelativePathString(basePath: SyncablePath) {
    const relativeIds = this.relativeTo(basePath);
    if (relativeIds === undefined) {
      return this.toString();
    }

    return `${relativeIds.map(encodeURIComponent).join('/')}`;
  }

  /** Same as `toString` except without the storageRootId */
  public toShortString() {
    return `/${this.ids.map(encodeURIComponent).join('/')}`;
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
export const syncablePathSchema = schema.custom<SyncablePath, Serialized>({
  typeName: 'SyncablePath',
  serDes: {
    isValueType: (value): value is SyncablePath => value instanceof SyncablePath,
    serializedSchema: () => serializedSchema,
    serialize: (value): SerializationResult => serializedSchema.serialize({ storageRootId: value.storageRootId, ids: [...value.ids] }),
    deserialize: (value): DeserializationResult<SyncablePath> => ({ deserialized: new SyncablePath(value.storageRootId, ...value.ids) })
  }
}) as schema.CustomSchema<SyncablePath, Serialized>;
