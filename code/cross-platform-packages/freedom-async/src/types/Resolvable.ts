export type ResolvableState = 'pending' | 'resolved' | 'rejected';

export class Resolvable<T> {
  public readonly isResolvable = true;

  private alreadyDone_ = false;
  private resolver_: ((value: T) => void) | undefined;
  private rejector_: ((error: unknown) => void) | undefined;
  public readonly promise: Promise<T>;
  private isResolved_: boolean = false;
  private isRejected_: boolean = false;
  private resolvedValue_: T | undefined;
  private rejectedValue_: unknown;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolver_ = resolve;
      this.rejector_ = reject;
    });
  }

  public readonly resolve = (value: T) => {
    if (this.alreadyDone_) {
      return; // Nothing to do
    }
    this.alreadyDone_ = true;

    this.resolvedValue_ = value;
    this.isResolved_ = true;

    this.resolver_?.(value);
  };

  public readonly reject = (error: unknown) => {
    if (this.alreadyDone_) {
      return; // Nothing to do
    }
    this.alreadyDone_ = true;

    this.rejectedValue_ = error;
    this.isRejected_ = true;

    this.rejector_?.(error);
  };

  public get isPending() {
    return !this.isResolved_ && !this.isRejected_;
  }

  public get state() {
    if (this.isResolved_) {
      return 'resolved';
    } else if (this.isRejected_) {
      return 'rejected';
    } else {
      return 'pending';
    }
  }

  public readonly getResolved = (): [true, T] | [false, undefined] =>
    this.isResolved_ ? [true, this.resolvedValue_!] : [false, undefined];

  public readonly getRejected = (): [true, unknown] | [false, undefined] =>
    this.isRejected_ ? [true, this.rejectedValue_] : [false, undefined];
}
