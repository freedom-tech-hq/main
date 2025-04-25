import { useEffect, useMemo } from 'react';
import { type Binding, useStableValue } from 'react-bindings';

import type { BindingPersistenceConfig } from '../types/BindingPersistenceConfig.ts';
import type { ManualBindingPersistenceExtras } from '../types/ManualBindingPersistenceExtras.ts';
import { makeBindingPersistence } from './makeBindingPersistence.ts';

export const useBindingPersistence = <T>(
  binding: Binding<T>,
  config: Omit<BindingPersistenceConfig, 'initAttached'>
): Binding<T> & ManualBindingPersistenceExtras => {
  const stableConfig = useStableValue(config);
  const wrappedBinding = useMemo(() => makeBindingPersistence(binding, stableConfig), [binding, stableConfig]);

  useEffect(() => wrappedBinding.attach());

  return wrappedBinding;
};
