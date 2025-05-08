import type { TestContext } from 'node:test';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { makeSuccess, sleep } from 'freedom-async';
import { makeTrace } from 'freedom-contexts';

import { TaskQueue } from '../TaskQueue.ts';

describe('TaskQueue', () => {
  let taskQueue: TaskQueue;

  beforeEach(() => {
    taskQueue = new TaskQueue('test', makeTrace('test'));
  });

  afterEach(() => taskQueue.stop());

  it('should add and run tasks sequentially', async (t: TestContext) => {
    const results: string[] = [];

    taskQueue.start({ maxConcurrency: 1 });

    taskQueue.add('task1', async () => {
      results.push('task1');
      return makeSuccess(undefined);
    });

    taskQueue.add('task2', async () => {
      results.push('task2');
      return makeSuccess(undefined);
    });

    t.assert.strictEqual(taskQueue.isEmpty(), false);

    await taskQueue.wait();

    t.assert.deepStrictEqual(results, ['task1', 'task2']);

    t.assert.strictEqual(taskQueue.isEmpty(), true);
  });

  it('high priority tasks should be run first', async (t: TestContext) => {
    const results: string[] = [];

    taskQueue.add('task1', async () => {
      results.push('task1');
      return makeSuccess(undefined);
    });

    taskQueue.add({ key: 'task2', priority: 'high' }, async () => {
      results.push('task2');
      return makeSuccess(undefined);
    });

    taskQueue.start({ maxConcurrency: 1 });

    t.assert.strictEqual(taskQueue.isEmpty(), false);

    await taskQueue.wait();

    t.assert.deepStrictEqual(results, ['task2', 'task1']);

    t.assert.strictEqual(taskQueue.isEmpty(), true);
  });

  it('should run tasks concurrently up to maxConcurrency', async (t: TestContext) => {
    const results: string[] = [];

    taskQueue.start({ maxConcurrency: 2 });

    taskQueue.add('task1', async () => {
      await sleep(100);
      results.push('task1');
      return makeSuccess(undefined);
    });

    taskQueue.add('task2', async () => {
      await sleep(50);
      results.push('task2');
      return makeSuccess(undefined);
    });

    taskQueue.add('task3', async () => {
      results.push('task3');
      return makeSuccess(undefined);
    });

    await taskQueue.wait();

    t.assert.deepStrictEqual(results, ['task2', 'task3', 'task1']);
  });

  it('should not start tasks if not started', async (t: TestContext) => {
    const results: string[] = [];

    taskQueue.add('task1', async () => {
      results.push('task1');
      return makeSuccess(undefined);
    });

    await taskQueue.wait();

    t.assert.deepStrictEqual(results, []);
  });

  it('should stop tasks once stopped', async (t: TestContext) => {
    const results: string[] = [];

    taskQueue.start({ maxConcurrency: 1 });

    taskQueue.add('task1', async () => {
      await sleep(50);
      results.push('task1');
      return makeSuccess(undefined);
    });

    taskQueue.add('task2', async () => {
      await sleep(50);
      results.push('task2');
      return makeSuccess(undefined);
    });

    taskQueue.stop();

    await taskQueue.wait();

    t.assert.deepStrictEqual(results, ['task1']);
  });

  it('should not add the same task twice', async (t: TestContext) => {
    const results: string[] = [];

    taskQueue.start({ maxConcurrency: 1 });

    taskQueue.add('task1', async () => {
      results.push('task1');
      return makeSuccess(undefined);
    });

    taskQueue.add('task1', async () => {
      results.push('task1-again');
      return makeSuccess(undefined);
    });

    await taskQueue.wait();

    t.assert.deepStrictEqual(results, ['task1']);
  });

  it('should run the latest version of a task if scheduled multiple times concurrently', async (t: TestContext) => {
    const results: string[] = [];

    taskQueue.start({ maxConcurrency: 1 });

    taskQueue.add({ key: 'task1', version: '0' }, async () => {
      await sleep(50);
      results.push('task1.0');
      return makeSuccess(undefined);
    });

    taskQueue.add({ key: 'task1', version: '1' }, async () => {
      await sleep(50);
      results.push('task1.1');
      return makeSuccess(undefined);
    });

    taskQueue.add({ key: 'task1', version: '2' }, async () => {
      await sleep(50);
      results.push('task1.2');
      return makeSuccess(undefined);
    });

    await taskQueue.wait();

    t.assert.deepStrictEqual(results, ['task1.0', 'task1.2']);
  });

  it("should run the same task multiple times if they've each completed", async (t: TestContext) => {
    const results: string[] = [];

    taskQueue.start({ maxConcurrency: 1 });

    taskQueue.add('task', async () => {
      await sleep(50);
      results.push('task.0');
      return makeSuccess(undefined);
    });

    await sleep(100);

    taskQueue.add('task', async () => {
      await sleep(50);
      results.push('task.1');
      return makeSuccess(undefined);
    });

    await sleep(100);

    taskQueue.add('task', async () => {
      await sleep(50);
      results.push('task.2');
      return makeSuccess(undefined);
    });

    await sleep(100);

    await taskQueue.wait();

    t.assert.deepStrictEqual(results, ['task.0', 'task.1', 'task.2']);
  });

  it('stopping while waiting should resolve after active tasks complete', async (t: TestContext) => {
    const results: string[] = [];

    taskQueue.start({ maxConcurrency: 1 });

    taskQueue.add('task1', async () => {
      await sleep(50);
      results.push('task1');
      return makeSuccess(undefined);
    });

    taskQueue.add('task2', async () => {
      await sleep(50);
      results.push('task2');
      return makeSuccess(undefined);
    });

    taskQueue.add('task3', async () => {
      await sleep(50);
      results.push('task3');
      return makeSuccess(undefined);
    });

    setTimeout(() => taskQueue.stop(), 0);
    await taskQueue.wait();

    t.assert.deepStrictEqual(results, ['task1']);
  });

  it('waiting on an empty queue should resolve immediately', async (_t: TestContext) => {
    taskQueue.start({ maxConcurrency: 1 });

    await taskQueue.wait();
  });

  it('delayWhenEmptyMSec should work', async (t: TestContext) => {
    const results: string[] = [];

    taskQueue.start({ maxConcurrency: 1, delayWhenEmptyMSec: 500 });

    taskQueue.add('task1', async () => {
      results.push('task1');
      return makeSuccess(undefined);
    });

    taskQueue.add('task2', async () => {
      results.push('task2');
      return makeSuccess(undefined);
    });

    t.assert.deepStrictEqual(results, []);

    await sleep(50);

    t.assert.deepStrictEqual(results, []);

    await sleep(450);

    t.assert.deepStrictEqual(results, ['task1', 'task2']);
  });

  it('calling when when using delayWhenEmptyMSec should immediately kickstart processing', async (t: TestContext) => {
    const results: string[] = [];

    taskQueue.start({ maxConcurrency: 1, delayWhenEmptyMSec: 500 });

    taskQueue.add('task1', async () => {
      results.push('task1');
      return makeSuccess(undefined);
    });

    taskQueue.add('task2', async () => {
      results.push('task2');
      return makeSuccess(undefined);
    });

    t.assert.deepStrictEqual(results, []);

    await sleep(50);

    t.assert.deepStrictEqual(results, []);

    await taskQueue.wait();

    t.assert.deepStrictEqual(results, ['task1', 'task2']);
  });
});
