import type { ReadonlyBinding } from 'react-bindings';
import type { JsonValue } from 'yaschema';

export interface BindingPersistenceStorage {
  isReady: ReadonlyBinding<boolean>;
  promise: Promise<void>;
  get: (key: string) => JsonValue | undefined;
  remove: (key: string) => void;
  set: (key: string, value: JsonValue) => void;
  /**
   * Returns a function that can be used to remove the listener.
   *
   * `newValue` will be undefined if `remove` was called.
   */
  addChangeListener: (key: string, callback: (newValue: JsonValue | undefined) => void) => () => void;
}
