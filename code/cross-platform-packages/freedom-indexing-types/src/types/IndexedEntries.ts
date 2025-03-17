import type { PR, PRFunc, Result } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { TypeOrPromisedType } from 'yaschema';

export interface IndexedEntries<KeyT extends string, ValueT = undefined> {
  /** Gets the array of entries */
  entries: PRFunc<Array<[KeyT, ValueT]>>;

  /** Loops through each entry, stopping on and returning the first failure */
  forEach: <ErrorCodeT extends string = never>(
    trace: Trace,
    callback: (trace: Trace, key: KeyT, value: ValueT) => TypeOrPromisedType<Result<undefined, ErrorCodeT> | void>
  ) => PR<undefined, ErrorCodeT>;

  /** Gets the array of keys */
  keys: PRFunc<KeyT[]>;

  /** Loops through each entry and returns an array of values returned by the specified callback.  Returns the first failure, if one
   * occurs. */
  map: <SuccessT, ErrorCodeT extends string = never>(
    trace: Trace,
    callback: (trace: Trace, key: KeyT, value: ValueT) => TypeOrPromisedType<Result<SuccessT, ErrorCodeT>>
  ) => PR<SuccessT[], ErrorCodeT>;
}
