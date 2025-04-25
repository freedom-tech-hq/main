import { inline } from 'freedom-async';
import type { Binding } from 'react-bindings';
import { resolveTypeOrDeferredType } from 'react-bindings';
import type { JsonValue } from 'yaschema';

import type { BindingPersistenceConfig } from '../types/BindingPersistenceConfig.ts';
import type { ManualBindingPersistenceExtras } from '../types/ManualBindingPersistenceExtras.ts';

export const makeBindingPersistence = <T>(
  binding: Binding<T>,
  config: BindingPersistenceConfig
): Binding<T> & ManualBindingPersistenceExtras => {
  const { storage, key = binding.id, isValid } = config;

  if (storage === undefined) {
    return {
      ...binding,
      attach: () => () => {},
      deleteFromStorage: () => {},
      pullFromStorage: () => {},
      pushToStorage: () => {}
    };
  }

  if (binding.setValueTransformer !== undefined) {
    throw new Error(`setValueTransformer cannot be used on bindings with makeBindingPersistence`);
  }

  const deleteFromStorage = () => {
    resolvedStorage.remove(key);
  };

  const pullFromStorage = () => {
    const initialValue = resolvedStorage.get(key);

    if (isValid(initialValue)) {
      // We don't want the initial value setting to mark the binding as changed -- even if it's delayed
      binding.setRaw(initialValue as T);
    }
  };

  const pushToStorage = () => {
    const newValue = binding.get();
    if (resolvedStorage.get(key) !== newValue) {
      resolvedStorage.set(key, newValue as JsonValue);
    }
  };

  const attach = () => {
    pullFromStorage();

    const removeStorageChangeListener = resolvedStorage.addChangeListener(key, (newValue) => {
      if (binding.get() !== newValue) {
        if (newValue === undefined) {
          binding.reset();
        } else if (config.isValid(newValue)) {
          binding.set(newValue as T);
        }
      }
    });
    const removeBindingChangeListener = binding.addChangeListener(pushToStorage);

    let alreadyRemoved = false;
    return () => {
      if (alreadyRemoved) {
        return;
      }
      alreadyRemoved = true;

      removeBindingChangeListener();
      removeStorageChangeListener();
    };
  };

  const resolvedStorage = resolveTypeOrDeferredType(storage);
  if (!resolvedStorage.isReady.get()) {
    inline(async () => {
      await resolvedStorage.promise;
      makeBindingPersistence(binding, config);
    });

    return { ...binding, attach, deleteFromStorage, pullFromStorage, pushToStorage };
  }

  if (config.initAttached ?? false) {
    attach();
  } else {
    const initialValue = resolvedStorage.get(key);

    if (isValid(initialValue)) {
      // We don't want the initial value setting to mark the binding as changed -- even if it's delayed
      binding.setRaw(initialValue as T);
    }
  }

  return { ...binding, attach, deleteFromStorage, pullFromStorage, pushToStorage };
};
