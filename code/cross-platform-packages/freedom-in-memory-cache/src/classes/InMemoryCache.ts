/** Caches values for the specified interval.  Every set, and optionally every get, access resets the interval.  Cache entries may also be
 * retained and released such that if an entry has a retain count &gt; 0 it will never be automatically invalidated and its timeout interval
 * will only begin counting once the retainCount goes back down to 0. */
export class InMemoryCache<KeyT extends string, ValueT, OwningObjectT = any> {
  private readonly cache_ = new Map<
    OwningObjectT,
    Map<
      KeyT,
      {
        retainCount: number;
        value: ValueT;
        timeout: ReturnType<typeof setTimeout> | undefined;
        onInvalidated?: (owner: OwningObjectT, key: KeyT, value: ValueT) => void;
      }
    >
  >();

  private readonly cacheDurationMSec_: number;
  private readonly shouldResetIntervalOnGet_: boolean;

  constructor({ cacheDurationMSec, shouldResetIntervalOnGet }: { cacheDurationMSec: number; shouldResetIntervalOnGet: boolean }) {
    this.cacheDurationMSec_ = cacheDurationMSec;
    this.shouldResetIntervalOnGet_ = shouldResetIntervalOnGet;
  }

  public get(owner: OwningObjectT, cacheKey: KeyT) {
    return this.get_(owner, cacheKey, { retain: false })?.value;
  }

  public getRetained(owner: OwningObjectT, cacheKey: KeyT) {
    const got = this.get_(owner, cacheKey, { retain: true });
    if (got === undefined) {
      return undefined;
    }

    return got as Required<typeof got>;
  }

  public getOrCreate(owner: OwningObjectT, cacheKey: KeyT, makeValue: () => ValueT): ValueT {
    const cached = this.get(owner, cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    return this.set(owner, cacheKey, makeValue());
  }

  public set(
    owner: OwningObjectT,
    cacheKey: KeyT,
    value: ValueT,
    { onInvalidated }: { onInvalidated?: (owner: OwningObjectT, key: KeyT, value: ValueT) => void } = {}
  ): ValueT {
    this.set_(owner, cacheKey, value, { retain: false, onInvalidated });
    return value;
  }

  public setRetained(
    owner: OwningObjectT,
    cacheKey: KeyT,
    value: ValueT,
    { onInvalidated }: { onInvalidated?: (owner: OwningObjectT, key: KeyT, value: ValueT) => void } = {}
  ): { value: ValueT; release: () => void } {
    const release = this.set_(owner, cacheKey, value, { retain: true, onInvalidated });
    return { value, release: release! };
  }

  public invalidateEverything() {
    const owners = this.cache_.keys();
    for (const owner of owners) {
      this.invalidateEverythingForOwner(owner);
    }
  }

  public invalidateEverythingForOwner(owner: OwningObjectT) {
    const ownerCache = this.cache_.get(owner);
    /* node:coverage disable */
    if (ownerCache === undefined) {
      return undefined;
    }
    /* node:coverage enable */

    for (const key of ownerCache.keys()) {
      this.invalidate(owner, key);
    }
  }

  public invalidate(owner: OwningObjectT, cacheKey: KeyT) {
    const ownerCache = this.cache_.get(owner);
    /* node:coverage disable */
    if (ownerCache === undefined) {
      return undefined;
    }
    /* node:coverage enable */

    const cached = ownerCache.get(cacheKey);
    /* node:coverage disable */
    if (cached === undefined) {
      return undefined;
    }
    /* node:coverage enable */

    clearTimeout(cached.timeout);
    ownerCache.delete(cacheKey);
    if (ownerCache.size === 0) {
      this.cache_.delete(owner);
    }

    cached.onInvalidated?.(owner, cacheKey, cached.value);
  }

  public invalidateWithKeyPrefix(owner: OwningObjectT, cacheKeyPrefix: string) {
    const ownerCache = this.cache_.get(owner);
    /* node:coverage disable */
    if (ownerCache === undefined) {
      return undefined;
    }
    /* node:coverage enable */

    const filteredKeys = Array.from(ownerCache.keys()).filter((key) => key.startsWith(cacheKeyPrefix));
    for (const key of filteredKeys) {
      this.invalidate(owner, key);
    }
  }

  // Private Methods

  private get_(owner: OwningObjectT, cacheKey: KeyT, { retain }: { retain: boolean }): { value: ValueT; release?: () => void } | undefined {
    const ownerCache = this.cache_.get(owner);
    if (ownerCache === undefined) {
      return undefined;
    }

    const cached = ownerCache.get(cacheKey);
    if (cached === undefined) {
      return undefined;
    }

    if (this.shouldResetIntervalOnGet_) {
      clearTimeout(cached.timeout);
      cached.timeout = cached.retainCount > 0 ? undefined : setTimeout(() => this.invalidate(owner, cacheKey), this.cacheDurationMSec_);
    }

    let release: (() => void) | undefined = undefined;
    if (retain) {
      clearTimeout(cached.timeout);
      cached.timeout = undefined;
      cached.retainCount += 1;

      let alreadyReleased = false;
      release = () => {
        /* node:coverage disable */
        if (alreadyReleased) {
          return;
        }
        /* node:coverage enable */
        alreadyReleased = true;

        cached.retainCount -= 1;
        if (cached.retainCount <= 0) {
          clearTimeout(cached.timeout);
          cached.timeout = setTimeout(() => this.invalidate(owner, cacheKey), this.cacheDurationMSec_);
        }
      };
    }

    return { value: cached.value, release };
  }

  /** If `retain` is `true`, return a function to release */
  private set_(
    owner: OwningObjectT,
    cacheKey: KeyT,
    value: ValueT,
    { retain, onInvalidated }: { retain: boolean; onInvalidated?: (owner: OwningObjectT, key: KeyT, value: ValueT) => void }
  ): (() => void) | undefined {
    this.invalidate(owner, cacheKey);

    let ownerCache = this.cache_.get(owner);
    if (ownerCache === undefined) {
      ownerCache = new Map();
      this.cache_.set(owner, ownerCache);
    }

    const cacheEntry = {
      retainCount: retain ? 1 : 0,
      value,
      timeout: retain ? undefined : setTimeout(() => this.invalidate(owner, cacheKey), this.cacheDurationMSec_),
      onInvalidated
    };
    ownerCache.set(cacheKey, cacheEntry);

    if (retain) {
      let alreadyReleased = false;
      return () => {
        /* node:coverage disable */
        if (alreadyReleased) {
          return;
        }
        /* node:coverage enable */
        alreadyReleased = true;

        cacheEntry.retainCount -= 1;
        if (cacheEntry.retainCount <= 0) {
          clearTimeout(cacheEntry.timeout);
          cacheEntry.timeout = setTimeout(() => this.invalidate(owner, cacheKey), this.cacheDurationMSec_);
        }
      };
    } else {
      return undefined;
    }
  }
}
