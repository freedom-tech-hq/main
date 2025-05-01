import { afterEach, describe, it } from 'node:test';

import { expectStrictEqual, sleep } from 'freedom-testing-tools';

import { InMemoryCache, invalidateAllInMemoryCaches } from '../InMemoryCache.ts';

describe('InMemoryCache', () => {
  afterEach(invalidateAllInMemoryCaches);

  it('getting and setting should work', async () => {
    const cache = new InMemoryCache<string, number>({ cacheDurationMSec: 500, shouldResetIntervalOnGet: true });

    const owner = {};

    expectStrictEqual(cache.get(owner, 'key'), undefined);
    cache.set(owner, 'key', 3.14);
    expectStrictEqual(cache.get(owner, 'key'), 3.14);

    await sleep(50);

    expectStrictEqual(cache.get(owner, 'key'), 3.14);

    await sleep(1000);

    expectStrictEqual(cache.get(owner, 'key'), undefined);
  });

  it('replacing should work', async () => {
    const cache = new InMemoryCache<string, number>({ cacheDurationMSec: 500, shouldResetIntervalOnGet: true });

    const owner = {};

    expectStrictEqual(cache.get(owner, 'key'), undefined);
    cache.set(owner, 'key', 3.14);
    expectStrictEqual(cache.get(owner, 'key'), 3.14);
    cache.set(owner, 'key', 6.28);
    expectStrictEqual(cache.get(owner, 'key'), 6.28);

    await sleep(50);

    expectStrictEqual(cache.get(owner, 'key'), 6.28);

    await sleep(1000);

    expectStrictEqual(cache.get(owner, 'key'), undefined);
  });

  it('getOrCreate should work', async () => {
    const cache = new InMemoryCache<string, number>({ cacheDurationMSec: 500, shouldResetIntervalOnGet: true });

    const owner = {};

    expectStrictEqual(
      cache.getOrCreate(owner, 'key', () => 3.14),
      3.14
    );
    expectStrictEqual(
      cache.getOrCreate(owner, 'key', () => 6.28),
      3.14
    );
  });

  it('invalidating everything should work', async () => {
    const cache = new InMemoryCache<string, number>({ cacheDurationMSec: 500, shouldResetIntervalOnGet: true });

    const owner = {};

    expectStrictEqual(cache.get(owner, 'key'), undefined);
    cache.set(owner, 'key', 3.14);
    expectStrictEqual(cache.get(owner, 'key'), 3.14);

    cache.invalidateEverything();

    expectStrictEqual(cache.get(owner, 'key'), undefined);
  });

  it('invalidating an owner should work', async () => {
    const cache = new InMemoryCache<string, number>({ cacheDurationMSec: 500, shouldResetIntervalOnGet: true });

    const owner = {};

    expectStrictEqual(cache.get(owner, 'key'), undefined);
    cache.set(owner, 'key', 3.14);
    expectStrictEqual(cache.get(owner, 'key'), 3.14);

    cache.invalidateEverythingForOwner(owner);

    expectStrictEqual(cache.get(owner, 'key'), undefined);
  });

  it('invalidating a specific key should work', async () => {
    const cache = new InMemoryCache<string, number>({ cacheDurationMSec: 500, shouldResetIntervalOnGet: true });

    const owner = {};

    cache.set(owner, 'key1', 3.14);
    cache.set(owner, 'key2', 1);
    expectStrictEqual(cache.get(owner, 'key1'), 3.14);
    expectStrictEqual(cache.get(owner, 'key2'), 1);

    cache.invalidate(owner, 'key1');

    expectStrictEqual(cache.get(owner, 'key1'), undefined);
    expectStrictEqual(cache.get(owner, 'key2'), 1);
  });

  it('invalidating with a key prefix should work', async () => {
    const cache = new InMemoryCache<string, number>({ cacheDurationMSec: 500, shouldResetIntervalOnGet: true });

    const owner = {};

    cache.set(owner, 'key1', 3.14);
    cache.set(owner, 'key2', 1);
    expectStrictEqual(cache.get(owner, 'key1'), 3.14);
    expectStrictEqual(cache.get(owner, 'key2'), 1);

    cache.invalidateWithKeyPrefix(owner, 'key');

    expectStrictEqual(cache.get(owner, 'key1'), undefined);
    expectStrictEqual(cache.get(owner, 'key2'), undefined);
  });

  it('setRetained and releasing should work', async () => {
    const cache = new InMemoryCache<string, number>({ cacheDurationMSec: 500, shouldResetIntervalOnGet: true });

    const owner = {};

    expectStrictEqual(cache.get(owner, 'key'), undefined);
    const { release } = cache.setRetained(owner, 'key', 3.14);
    try {
      expectStrictEqual(cache.get(owner, 'key'), 3.14);

      await sleep(1000);

      expectStrictEqual(cache.get(owner, 'key'), 3.14);
    } finally {
      release();

      await sleep(50);

      expectStrictEqual(cache.get(owner, 'key'), 3.14);

      await sleep(1000);

      expectStrictEqual(cache.get(owner, 'key'), undefined);
    }
  });

  it('getRetained and releasing should work', async () => {
    const cache = new InMemoryCache<string, number>({ cacheDurationMSec: 500, shouldResetIntervalOnGet: true });

    const owner = {};

    expectStrictEqual(cache.get(owner, 'key'), undefined);
    cache.set(owner, 'key', 3.14);

    const got = cache.getRetained(owner, 'key');
    expectStrictEqual(got?.value, 3.14);
    const release = got!.release;

    try {
      expectStrictEqual(cache.get(owner, 'key'), 3.14);

      await sleep(1000);

      expectStrictEqual(cache.get(owner, 'key'), 3.14);
    } finally {
      release();

      await sleep(50);

      expectStrictEqual(cache.get(owner, 'key'), 3.14);

      await sleep(1000);

      expectStrictEqual(cache.get(owner, 'key'), undefined);
    }
  });

  it('multiple retainers should work', async () => {
    const cache = new InMemoryCache<string, number>({ cacheDurationMSec: 500, shouldResetIntervalOnGet: true });

    const owner = {};

    expectStrictEqual(cache.get(owner, 'key'), undefined);
    const release1 = cache.setRetained(owner, 'key', 3.14).release;

    const got = cache.getRetained(owner, 'key');
    expectStrictEqual(got?.value, 3.14);
    const release2 = got!.release;

    try {
      try {
        expectStrictEqual(cache.get(owner, 'key'), 3.14);

        await sleep(1000);

        expectStrictEqual(cache.get(owner, 'key'), 3.14);
      } finally {
        release2();

        await sleep(50);

        expectStrictEqual(cache.get(owner, 'key'), 3.14);

        await sleep(1000);

        expectStrictEqual(cache.get(owner, 'key'), 3.14);
      }
    } finally {
      release1();

      await sleep(50);

      expectStrictEqual(cache.get(owner, 'key'), 3.14);

      await sleep(1000);

      expectStrictEqual(cache.get(owner, 'key'), undefined);
    }
  });

  it('invalidateAllInMemoryCaches should work', async () => {
    const cache = new InMemoryCache<string, number>({ cacheDurationMSec: 60000, shouldResetIntervalOnGet: true });

    const owner = {};

    expectStrictEqual(cache.get(owner, 'key'), undefined);
    cache.set(owner, 'key', 3.14);
    expectStrictEqual(cache.get(owner, 'key'), 3.14);

    await sleep(50);

    expectStrictEqual(cache.get(owner, 'key'), 3.14);

    invalidateAllInMemoryCaches();

    expectStrictEqual(cache.get(owner, 'key'), undefined);
  });
});
