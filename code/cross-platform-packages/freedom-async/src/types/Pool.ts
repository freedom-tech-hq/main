import { DoubleLinkedList } from 'doublell';
import type { Trace } from 'freedom-contexts';
import { makeTrace } from 'freedom-contexts';
import isPromise from 'is-promise';

import type { PR } from './PR.ts';
import type { PRFunc } from './PRFunc.ts';
import { makeSuccess } from './Result.ts';

export class Pool<T> {
  private readonly size_: number;
  private readonly maker_: PRFunc<T>;
  private readonly items_ = new DoubleLinkedList<PR<T>>();

  private readonly trace_: Trace;

  constructor(idStack: string[], size: number, maker: PRFunc<T>) {
    this.trace_ = makeTrace(...idStack);
    this.size_ = size;
    this.maker_ = maker;

    // Not waiting
    this.makeItems_();
  }

  public async get(): PR<T> {
    while (true) {
      if (this.items_.isEmpty()) {
        await this.makeItems_();
      } else {
        const item = this.items_.getHead();
        if (item !== undefined) {
          this.items_.remove(item);

          // Not waiting
          this.makeItems_();

          return await item.value;
        }
      }
    }
  }

  public putBack(item: T | PR<T>) {
    if (isPromise(item)) {
      this.items_.prepend(item);
    } else {
      this.items_.prepend(Promise.resolve(makeSuccess(item)));
    }

    if (this.items_.getLength() > this.size_) {
      const itemToRemove = this.items_.getTail();
      if (itemToRemove !== undefined) {
        this.items_.remove(itemToRemove);
      }
    }
  }

  private async makeItems_() {
    if (this.items_.getLength() >= this.size_) {
      return;
    }

    const made = this.maker_(this.trace_);
    this.items_.append(made);

    await made;

    this.makeItems_();
  }
}
