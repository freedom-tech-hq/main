import type { PR } from 'freedom-async';
import { makeSuccess } from 'freedom-async';
import { Cast } from 'freedom-cast';
import { generalizeFailureResult } from 'freedom-common-errors';
import { type Trace } from 'freedom-contexts';
import type { MutableIndexStore } from 'freedom-indexing-types';
import { InMemoryIndexStore } from 'freedom-indexing-types';
import type { LockStore } from 'freedom-locking-types';
import { InMemoryLockStore } from 'freedom-locking-types';
import type { InMemoryObjectStoreConstructorArgs, MutableObjectStore } from 'freedom-object-store-types';
import { InMemoryObjectStore } from 'freedom-object-store-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';
import { DefaultSyncableStore, generateProvenanceForNewSyncableStore, InMemorySyncableStoreBacking } from 'freedom-syncable-store-types';

import type { DataSources } from './DataSources.ts';
import type { GetOrCreateIndexStoreArgs } from './GetOrCreateIndexStoreArgs.ts';
import type { GetOrCreateLockStoreArgs } from './GetOrCreateLockStoreArgs.ts';
import type { GetOrCreateObjectStoreArgs } from './GetOrCreateObjectStoreArgs.ts';
import type { GetOrCreateSyncableStoreArgs } from './GetOrCreateSyncableStoreArgs.ts';

export class InMemoryDataSources implements DataSources {
  private readonly syncableStores_: Partial<Record<string, DefaultSyncableStore>> = {};
  private readonly lockStores_: Partial<Record<`${string}:${number}`, InMemoryLockStore<any>>> = {};
  private readonly indexStores_: Partial<Record<`${string}:${number}`, InMemoryIndexStore<any, any>>> = {};
  private readonly objectStores_: Partial<Record<`${string}:${number}`, InMemoryObjectStore<any, any>>> = {};

  // DataSources Methods

  public getOrCreateIndexStore<KeyT extends string, IndexedValueT>(
    trace: Trace,
    args: GetOrCreateIndexStoreArgs<KeyT, IndexedValueT>
  ): PR<MutableIndexStore<KeyT, IndexedValueT>> {
    return this.getOrCreateIndexStore_(trace, args);
  }

  public getOrCreateLockStore<KeyT extends string>(trace: Trace, args: GetOrCreateLockStoreArgs<KeyT>): PR<LockStore<KeyT>> {
    return this.getOrCreateLockStore_(trace, args);
  }

  public getOrCreateSyncableStore(trace: Trace, args: GetOrCreateSyncableStoreArgs): PR<MutableSyncableStore> {
    return this.getOrCreateSyncableStore_(trace, args);
  }

  public getOrCreateObjectStore<KeyT extends string, T>(
    trace: Trace,
    args: GetOrCreateObjectStoreArgs<KeyT, T>
  ): PR<MutableObjectStore<KeyT, T>> {
    return this.getOrCreateObjectStore_(trace, args);
  }

  public getOrCreateSecretStore<KeyT extends string, T>(
    trace: Trace,
    args: GetOrCreateObjectStoreArgs<KeyT, T>
  ): PR<MutableObjectStore<KeyT, T>> {
    return this.getOrCreateObjectStore_(trace, args);
  }

  // Private Methods

  private readonly getOrCreateSyncableStore_ = async (
    trace: Trace,
    { storageRootId, cryptoService, saltsById }: GetOrCreateSyncableStoreArgs
  ): PR<MutableSyncableStore> => {
    const cacheKey = storageRootId;
    const found = this.syncableStores_[cacheKey];
    if (found !== undefined) {
      return makeSuccess(found as MutableSyncableStore);
    }

    const privateKeys = await cryptoService.getPrivateCryptoKeySet(trace);
    if (!privateKeys.ok) {
      return generalizeFailureResult(trace, privateKeys, 'not-found');
    }

    const provenance = await generateProvenanceForNewSyncableStore(trace, {
      storageRootId,
      cryptoService,
      trustedTimeSignature: undefined
    });
    if (!provenance.ok) {
      return provenance;
    }

    const storeBacking = new InMemorySyncableStoreBacking({ provenance: provenance.value });

    const newStore = new DefaultSyncableStore({
      storageRootId,
      backing: storeBacking,
      cryptoService,
      creatorPublicKeys: privateKeys.value.publicOnly(),
      saltsById
    });

    this.syncableStores_[cacheKey] = newStore;
    return makeSuccess(newStore);
  };

  private readonly getOrCreateLockStore_ = async <KeyT extends string>(
    _trace: Trace,
    { id, version }: GetOrCreateLockStoreArgs<KeyT>
  ): PR<LockStore<KeyT>> => {
    const cacheKey: `${string}:${number}` = `${id}:${version}`;
    const found = this.lockStores_[cacheKey];
    if (found !== undefined) {
      return makeSuccess(found as LockStore<KeyT>);
    }

    const newStore = new InMemoryLockStore<KeyT>();
    this.lockStores_[cacheKey] = newStore;
    return makeSuccess(newStore);
  };

  private readonly getOrCreateIndexStore_ = async <KeyT extends string, IndexedValueT>(
    _trace: Trace,
    { id, version, config }: GetOrCreateIndexStoreArgs<KeyT, IndexedValueT>
  ): PR<MutableIndexStore<KeyT, IndexedValueT>> => {
    const cacheKey: `${string}:${number}` = `${id}:${version}`;
    const found = this.indexStores_[cacheKey];
    if (found !== undefined) {
      return makeSuccess(found as MutableIndexStore<KeyT, IndexedValueT>);
    }

    const newStore = new InMemoryIndexStore<KeyT, IndexedValueT>({ config });
    this.indexStores_[cacheKey] = newStore;
    return makeSuccess(newStore);
  };

  private readonly getOrCreateObjectStore_ = async <KeyT extends string, T>(
    _trace: Trace,
    { id, version, schema }: GetOrCreateObjectStoreArgs<KeyT, T>
  ): PR<MutableObjectStore<KeyT, T>> => {
    const cacheKey: `${string}:${number}` = `${id}:${version}`;
    const found = this.objectStores_[cacheKey];
    if (found !== undefined) {
      return makeSuccess(found as MutableObjectStore<KeyT, T>);
    }

    const newStore = new InMemoryObjectStore(Cast<InMemoryObjectStoreConstructorArgs<KeyT, T>>({ schema }));
    this.objectStores_[cacheKey] = newStore;
    return makeSuccess(newStore);
  };
}
