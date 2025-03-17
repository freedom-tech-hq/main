import type { TestContext } from 'node:test';
import { beforeEach, describe, it } from 'node:test';

import { makeSuccess, sleep } from 'freedom-async';
import { makeTrace } from 'freedom-contexts';

import { TaskQueue } from '../TaskQueue.ts';

describe('TaskQueue', () => {
  let taskQueue: TaskQueue;

  beforeEach(() => {
    taskQueue = new TaskQueue(makeTrace('test'));
  });

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
});
