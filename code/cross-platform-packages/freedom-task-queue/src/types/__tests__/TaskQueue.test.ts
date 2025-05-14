import { afterEach, beforeEach, describe, it } from 'node:test';

import { makeSuccess, sleep } from 'freedom-async';
import { makeTrace } from 'freedom-contexts';
import { expectDeepStrictEqual, expectStrictEqual } from 'freedom-testing-tools';

import { TaskQueue } from '../TaskQueue.ts';

describe('TaskQueue', () => {
  let taskQueue: TaskQueue;

  beforeEach(() => {
    taskQueue = new TaskQueue('test', makeTrace('test'));
  });

  afterEach(() => taskQueue.stop());

  it('should add and run tasks sequentially', async () => {
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

    expectStrictEqual(taskQueue.isEmpty(), false);

    await taskQueue.wait();

    expectDeepStrictEqual(results, ['task1', 'task2']);

    expectStrictEqual(taskQueue.isEmpty(), true);
  });

  it('high priority tasks should be run first', async () => {
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

    expectStrictEqual(taskQueue.isEmpty(), false);

    await taskQueue.wait();

    expectDeepStrictEqual(results, ['task2', 'task1']);

    expectStrictEqual(taskQueue.isEmpty(), true);
  });

  it('should run tasks concurrently up to maxConcurrency', async () => {
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

    expectDeepStrictEqual(results, ['task2', 'task3', 'task1']);
  });

  it('should not start tasks if not started', async () => {
    const results: string[] = [];

    taskQueue.add('task1', async () => {
      results.push('task1');
      return makeSuccess(undefined);
    });

    await taskQueue.wait();

    expectDeepStrictEqual(results, []);
  });

  it('should stop tasks once stopped', async () => {
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

    expectDeepStrictEqual(results, ['task1']);
  });

  it('should not add the same task twice', async () => {
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

    expectDeepStrictEqual(results, ['task1']);
  });

  it('should run the latest version of a task if scheduled multiple times concurrently', async () => {
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

    expectDeepStrictEqual(results, ['task1.0', 'task1.2']);
  });

  it("should run the same task multiple times if they've each completed", async () => {
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

    expectDeepStrictEqual(results, ['task.0', 'task.1', 'task.2']);
  });

  it('stopping while waiting should resolve after active tasks complete', async () => {
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

    expectDeepStrictEqual(results, ['task1']);
  });

  it('waiting on an empty queue should resolve immediately', async () => {
    taskQueue.start({ maxConcurrency: 1 });

    await taskQueue.wait();
  });

  it('delayWhenEmptyMSec should work', async () => {
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

    expectDeepStrictEqual(results, []);

    await sleep(50);

    expectDeepStrictEqual(results, []);

    await sleep(450);

    expectDeepStrictEqual(results, ['task1', 'task2']);
  });

  it('calling when when using delayWhenEmptyMSec should immediately kickstart processing', async () => {
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

    expectDeepStrictEqual(results, []);

    await sleep(50);

    expectDeepStrictEqual(results, []);

    await taskQueue.wait();

    expectDeepStrictEqual(results, ['task1', 'task2']);
  });

  it('pausing and unpausing should work', async () => {
    const results: string[] = [];

    taskQueue.start({ maxConcurrency: 1 });

    const unpause = taskQueue.pause();

    taskQueue.add('task1', async () => {
      results.push('task1');
      return makeSuccess(undefined);
    });

    taskQueue.add('task2', async () => {
      results.push('task2');
      return makeSuccess(undefined);
    });

    // Tasks shouldn't run while paused
    await sleep(50);
    expectDeepStrictEqual(results, []);
    expectStrictEqual(taskQueue.isPaused(), true);

    // Unpause should allow tasks to run
    unpause();
    expectStrictEqual(taskQueue.isPaused(), false);

    await taskQueue.wait();
    expectDeepStrictEqual(results, ['task1', 'task2']);

    // Test nested pauses
    const unpause1 = taskQueue.pause();
    const unpause2 = taskQueue.pause();

    taskQueue.add('task3', async () => {
      results.push('task3');
      return makeSuccess(undefined);
    });

    // One unpause shouldn't resume processing
    unpause1();
    expectStrictEqual(taskQueue.isPaused(), true);
    await sleep(50);
    expectDeepStrictEqual(results, ['task1', 'task2']);

    // Second unpause should resume processing
    unpause2();
    expectStrictEqual(taskQueue.isPaused(), false);

    await taskQueue.wait();
    expectDeepStrictEqual(results, ['task1', 'task2', 'task3']);
  });
});
