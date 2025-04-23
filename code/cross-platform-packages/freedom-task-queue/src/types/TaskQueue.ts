import type { DoubleLinkedListNode } from 'doublell';
import { DoubleLinkedList } from 'doublell';
import type { PRFunc } from 'freedom-async';
import { callAsyncResultFunc, FREEDOM_MAX_CONCURRENCY_DEFAULT, inline, Resolvable } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import { makeSubTrace } from 'freedom-contexts';

interface Entry {
  key: string;
  version: string;
  run: PRFunc<undefined>;
}

export class TaskQueue {
  private readonly entryNodesByKey_: Partial<Record<string, DoubleLinkedListNode<Entry>>> = {};
  private readonly entries_ = new DoubleLinkedList<Entry>();
  private readonly inFlightVersionsByKey_: Partial<Record<string, string>> = {};
  private isRunning_ = false;
  private maxConcurrency_ = 1;
  private numActive = 0;
  private pendingWaiter_: Resolvable<void> | undefined;
  private runNextTrace_: Trace;
  private delayWhenEmptyMSec_: number = 0;

  constructor(trace: Trace) {
    this.runNextTrace_ = makeSubTrace(trace, ['runNext_']);
  }

  /**
   * Only one entry per key can be in-flight at a time.  If new versions are added for the same key while enqueued, only the latest version
   * will be used once the queue processes the key.  If new versions are added while processing the same key, a new queue entry will be
   * created.
   *
   * If `keyAndVersion` is a string, the version is assumed to be an empty string.  If `keyAndVersion` is an object, but version is
   * `undefined`, the version is assumed to be an empty string.
   */
  public readonly add = (keyAndVersion: { key: string; version?: string } | string, run: PRFunc<undefined>) => {
    const { key, version } =
      typeof keyAndVersion === 'string'
        ? { key: keyAndVersion, version: '' }
        : { key: keyAndVersion.key, version: keyAndVersion.version ?? '' };

    let entryNode = this.entryNodesByKey_[key];
    if (entryNode !== undefined) {
      entryNode.value.version = version;
      entryNode.value.run = run;
      return; // Already enqueued the same key, but will now be processed with the new version
    }

    const inFlightVersion = this.inFlightVersionsByKey_[key];
    if (inFlightVersion !== undefined && inFlightVersion === version) {
      return; // Already processing the same key/version
    }

    entryNode = this.entries_.append({ key, version, run });
    this.entryNodesByKey_[key] = entryNode;

    if (this.delayWhenEmptyMSec_ > 0 && this.numActive === 0) {
      setTimeout(() => this.runMore_(), this.delayWhenEmptyMSec_);
    } else {
      this.runMore_();
    }
  };

  public readonly start = ({
    maxConcurrency = FREEDOM_MAX_CONCURRENCY_DEFAULT,
    delayWhenEmptyMSec = 0
  }: {
    /**
     * The maximum number of simultaneously processed tasks
     *
     * @defaultValue `FREEDOM_MAX_CONCURRENCY_DEFAULT`
     */
    maxConcurrency?: number;
    /**
     * If the task queue is empty when `add` is called, the number of milliseconds delay before processing will start.
     *
     * @defaultValue `0`
     */
    delayWhenEmptyMSec?: number;
  } = {}) => {
    this.maxConcurrency_ = maxConcurrency;
    this.delayWhenEmptyMSec_ = delayWhenEmptyMSec;
    this.isRunning_ = true;

    this.runMore_();
  };

  public readonly stop = () => {
    this.isRunning_ = false;

    /* node:coverage disable */
    if (this.numActive === 0 && this.pendingWaiter_ !== undefined) {
      this.resolvePendingWaiter_();
    }
    /* node:coverage enable */
  };

  public readonly isEmpty = () => this.entries_.getLength() === 0 && this.numActive === 0;

  /** If the task queue is running, waits until there are no pending or active entries.  If the task queue isn't running, waits until there
   * are no active entries */
  public readonly wait = async () => {
    if (this.isRunning_) {
      if (this.isEmpty()) {
        return;
      }

      // If the queue is running and not empty, immediately calling runMore_ to process the queue in case delayWhenEmptyMSec was used to
      // otherwise delay processing on add
      this.runMore_();
    } else {
      if (this.numActive === 0) {
        return;
      }
    }

    if (this.pendingWaiter_ === undefined) {
      this.pendingWaiter_ = new Resolvable<void>();
    }

    return await this.pendingWaiter_.promise;
  };

  // Private Methods

  private readonly resolvePendingWaiter_ = () => {
    const lastPendingWaiter = this.pendingWaiter_;
    if (lastPendingWaiter === undefined) {
      return;
    }

    this.pendingWaiter_ = undefined;
    lastPendingWaiter.resolve();
  };

  private readonly runMore_ = () => {
    if (!this.isRunning_) {
      if (this.numActive === 0) {
        this.resolvePendingWaiter_();
      }

      return; // Not ready
    }

    while (this.numActive < this.maxConcurrency_ && this.entries_.getLength() > 0) {
      if (!this.runNext_()) {
        return;
      }
    }

    if (this.isEmpty()) {
      this.resolvePendingWaiter_();
    }
  };

  private readonly runNext_ = (): boolean => {
    let next = this.entries_.getHead();
    /* node:coverage disable */
    if (next === undefined) {
      return false;
    }
    /* node:coverage enable */

    // If we're already processing a task for this key, skip to the next one
    while (this.inFlightVersionsByKey_[next.value.key] !== undefined) {
      next = next.nextNode;

      if (next === undefined) {
        return false;
      }
    }

    const { key, version, run } = next.value;

    this.inFlightVersionsByKey_[key] = version;
    this.entries_.remove(next);
    delete this.entryNodesByKey_[key];

    this.numActive += 1;
    inline(async () => {
      try {
        await callAsyncResultFunc(this.runNextTrace_, {}, run);
      } finally {
        delete this.inFlightVersionsByKey_[key];

        this.numActive -= 1;
        this.runMore_();
      }
    });

    return true;
  };
}
