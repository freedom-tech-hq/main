import { isEqual } from 'lodash-es';

import type { DynamicSyncableId } from './DynamicSyncableId.ts';
import type { StorageRootId } from './StorageRootId.ts';

export class DynamicSyncablePath {
  public readonly storageRootId: StorageRootId;
  public readonly ids: Readonly<DynamicSyncableId[]>;

  constructor(storageRootId: StorageRootId, ...ids: DynamicSyncableId[]) {
    this.storageRootId = storageRootId;
    this.ids = ids;
  }

  /** Returns a new path with an appended ID */
  public append(...ids: DynamicSyncableId[]) {
    return new DynamicSyncablePath(this.storageRootId, ...this.ids, ...ids);
  }

  /** Returns a new path one level up.  For the root path, this returns `undefined`. */
  public get parentPath(): DynamicSyncablePath | undefined {
    if (this.ids.length === 0) {
      return undefined;
    } else {
      return new DynamicSyncablePath(this.storageRootId, ...this.ids.slice(0, this.ids.length - 1));
    }
  }

  public get lastId(): DynamicSyncableId | undefined {
    return this.ids[this.ids.length - 1];
  }

  public isEqual(anotherPath: DynamicSyncablePath) {
    return this.storageRootId === anotherPath.storageRootId && isEqual(this.ids, anotherPath.ids);
  }

  public toString() {
    return `${encodeURIComponent(this.storageRootId)}:/${this.ids
      .map((id) => {
        if (typeof id === 'string') {
          return encodeURIComponent(id);
        } else {
          switch (id.type) {
            case 'encrypted':
              return encodeURIComponent(id.plainId);
            case 'time':
              return encodeURIComponent(id.uuid);
          }
        }
      })
      .join('/')}`;
  }
}
