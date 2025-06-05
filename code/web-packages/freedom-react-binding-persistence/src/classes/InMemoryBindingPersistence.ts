import { DoubleLinkedList } from 'doublell';
import { makeConstBinding } from 'react-bindings';
import type { JsonValue } from 'yaschema';

import type { BindingPersistenceStorage } from '../types/BindingPersistenceStorage.ts';

export class InMemoryBindingPersistence implements BindingPersistenceStorage {
  private readonly listenerCallbacks_: Record<string, DoubleLinkedList<(newValue: JsonValue | undefined) => void>> = {};
  private readonly storage_ = new Map<string, string>();

  public readonly isReady = makeConstBinding(true, { id: 'isReady' });

  public readonly promise = new Promise<void>((resolve) => resolve());

  public readonly addChangeListener = (key: string, callback: (newValue: JsonValue | undefined) => void): (() => void) => {
    const callbacksForKey = this.listenerCallbacks_[key] ?? new DoubleLinkedList<(newValue: JsonValue | undefined) => void>();
    this.listenerCallbacks_[key] = callbacksForKey;

    const node = callbacksForKey.append(callback);
    let alreadyRemoved = false;
    return () => {
      if (alreadyRemoved) {
        return;
      }
      alreadyRemoved = true;

      return callbacksForKey.remove(node);
    };
  };

  public readonly clear = () => {
    for (const key of Array.from(this.storage_.keys())) {
      this.remove(key);
    }
  };

  public readonly get = (key: string): JsonValue | undefined => {
    const stored = this.storage_.get(key);
    if (stored === undefined) {
      return undefined;
    } else {
      try {
        return JSON.parse(stored) as JsonValue;
      } catch (_e) {
        return undefined;
      }
    }
  };

  public readonly set = (key: string, value: JsonValue) => {
    try {
      this.storage_.set(key, JSON.stringify(value));
      this.triggerChangeListeners_(key, value);
    } catch (_e) {
      return;
    }
  };

  public readonly remove = (key: string) => {
    try {
      this.storage_.delete(key);
      this.triggerChangeListeners_(key, undefined);
    } catch (_e) {
      return;
    }
  };

  private readonly triggerChangeListeners_ = (key: string, newValue: JsonValue | undefined) => {
    const callbacksForKey = this.listenerCallbacks_[key];
    if (callbacksForKey === undefined) {
      return;
    }

    for (const callback of callbacksForKey.toArray()) {
      callback(newValue);
    }
  };
}
