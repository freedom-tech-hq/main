import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { Resolvable } from '../Resolvable.ts';

describe('Resolvable', () => {
  it('should resolve with a value', async (t: TestContext) => {
    const resolvable = new Resolvable<number>();
    resolvable.resolve(3.14);

    const result = await resolvable.promise;
    t.assert.strictEqual(result, 3.14);
  });

  it('should reject with an error', async (t: TestContext) => {
    const resolvable = new Resolvable<number>();
    const error = new Error('Test error');
    resolvable.reject(error);

    try {
      await resolvable.promise;
    } catch (e) {
      t.assert.strictEqual(e, error);
    }
  });

  it('should not resolve or reject more than once', async (t: TestContext) => {
    const resolvable = new Resolvable<number>();
    resolvable.resolve(3.14);
    resolvable.resolve(100);
    resolvable.reject(new Error('Test error'));

    const result = await resolvable.promise;
    t.assert.strictEqual(result, 3.14);
  });

  it('should have a pending state initially', (t: TestContext) => {
    const resolvable = new Resolvable<number>();
    t.assert.strictEqual(resolvable.isPending, true);
    t.assert.strictEqual(resolvable.state, 'pending');
  });

  it('should have a resolved state after resolving', async (t: TestContext) => {
    const resolvable = new Resolvable<number>();
    t.assert.strictEqual(resolvable.getResolved()[0], false);
    resolvable.resolve(3.14);

    await resolvable.promise;
    t.assert.strictEqual(resolvable.isPending, false);
    t.assert.strictEqual(resolvable.state, 'resolved');
    t.assert.strictEqual(resolvable.getResolved()[0], true);
    t.assert.strictEqual(resolvable.getResolved()[1], 3.14);
  });

  it('should have a rejected state after rejecting', async (t: TestContext) => {
    const resolvable = new Resolvable<number>();
    t.assert.strictEqual(resolvable.getRejected()[0], false);
    resolvable.reject(new Error('Test error'));

    try {
      await resolvable.promise;
    } catch {
      t.assert.strictEqual(resolvable.isPending, false);
      t.assert.strictEqual(resolvable.state, 'rejected');
      t.assert.strictEqual(resolvable.getRejected()[0], true);
      t.assert.strictEqual((resolvable.getRejected()[1] as Error).message, 'Test error');
    }
  });
});
