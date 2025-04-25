import type { TypeOrDeferredType } from '../internal/TypeOrDeferredType.ts';
import type { BindingPersistenceStorage } from './BindingPersistenceStorage.ts';

export interface BindingPersistenceConfig {
  /** If `undefined`, persistence is disabled */
  storage: TypeOrDeferredType<BindingPersistenceStorage> | undefined;
  isValid: (value: any) => boolean;
  /** @defaultValue The `id` of the specified binding */
  key?: string;
  /** @defaultValue `false` */
  initAttached?: boolean;
}
