import type { SyncablePath } from 'freedom-sync-types';

import type { MutableTrustMarkStore } from './MutableTrustMarkStore.ts';

interface TrustMarkStoreStorage {
  [key: `/${string}`]: TrustMarkStoreStorage | undefined;
  [key: `#${string}`]: true | undefined;
}

export class InMemoryTrustMarkStore implements MutableTrustMarkStore {
  private readonly storage: TrustMarkStoreStorage = {};

  public isTrusted(path: SyncablePath, markId: string): boolean {
    let cursor: TrustMarkStoreStorage | undefined = this.storage;
    for (const id of path.ids) {
      cursor = cursor?.[`/${id}`];
      if (cursor === undefined) {
        return false;
      }
    }

    return cursor?.[`#${markId}`] === true;
  }

  public markTrusted(path: SyncablePath, markId: string) {
    let cursor: TrustMarkStoreStorage = this.storage;
    for (const id of path.ids) {
      if (cursor[`/${id}`] === undefined) {
        cursor[`/${id}`] = {};
      }

      cursor = cursor[`/${id}`]!;
    }

    cursor[`#${markId}`] = true;
  }

  public clearTrust(path: SyncablePath, markId?: string) {
    let cursor: TrustMarkStoreStorage | undefined = this.storage;
    let index = 0;
    for (const id of path.ids) {
      const isLast = index === path.ids.length - 1;

      if (id === undefined && isLast) {
        delete cursor?.[`/${markId}`];
        return;
      }

      cursor = cursor?.[`/${id}`];
      if (cursor === undefined) {
        return;
      }

      index += 1;
    }

    delete cursor[`#${markId}`];
  }
}
