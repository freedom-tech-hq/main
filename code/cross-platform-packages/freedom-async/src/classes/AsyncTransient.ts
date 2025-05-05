import type { Trace } from 'freedom-contexts';

export class AsyncTransient<T> {
  private getValue_: (trace: Trace) => Promise<T>;
  constructor(getValue: (trace: Trace) => Promise<T>) {
    this.getValue_ = getValue;
  }

  private valuePromise_: Promise<T> | undefined;
  public getValue(trace: Trace): Promise<T> {
    if (this.valuePromise_ === undefined) {
      this.valuePromise_ = this.getValue_(trace);
    }

    return this.valuePromise_;
  }

  public markNeedsUpdate() {
    this.valuePromise_ = undefined;
  }
}
