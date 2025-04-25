import { type BindingPersistenceStorage, InMemoryBindingPersistence, LocalBindingPersistence } from 'freedom-react-binding-persistence';
import { once } from 'lodash-es';

export const inMemoryBindingPersistence = once((): BindingPersistenceStorage => new InMemoryBindingPersistence());
export const localBindingPersistence = once((): BindingPersistenceStorage => new LocalBindingPersistence({ keyPrefix: 'default/' }));
export const sessionBindingPersistence = once(
  (): BindingPersistenceStorage => new LocalBindingPersistence({ keyPrefix: 'default/', storage: window.sessionStorage })
);
