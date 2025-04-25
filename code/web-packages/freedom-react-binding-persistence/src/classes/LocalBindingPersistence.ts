import { DoubleLinkedList } from 'doublell';
import { makeConstBinding } from 'react-bindings';
import type { JsonValue } from 'yaschema';

import type { BindingPersistenceStorage } from '../types/BindingPersistenceStorage.ts';

export class LocalBindingPersistence implements BindingPersistenceStorage {
  public readonly keyPrefix: string;

  private readonly listenerCallbacks_: Record<string, DoubleLinkedList<(newValue: JsonValue | undefined) => void>> = {};
  private readonly storage_: Storage;

  constructor({ keyPrefix = '', storage = window.localStorage }: { keyPrefix?: string; storage?: Storage }) {
    this.keyPrefix = keyPrefix;
    this.storage_ = storage;
  }

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

  public readonly get = (key: string): JsonValue | undefined => {
    const resolvedKey = `${this.keyPrefix}${key}`;
    const stored = this.storage_.getItem(resolvedKey);
    if (stored === null) {
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
    const resolvedKey = `${this.keyPrefix}${key}`;
    try {
      this.storage_.setItem(resolvedKey, JSON.stringify(value));
      this.triggerChangeListeners_(key, value);
    } catch (_e) {
      return;
    }
  };

  public readonly remove = (key: string) => {
    const resolvedKey = `${this.keyPrefix}${key}`;
    try {
      this.storage_.removeItem(resolvedKey);
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
