import { InMemoryLockStore } from 'freedom-locking-types';
import { once } from 'lodash-es';

export const getLockStore = once(() => new InMemoryLockStore());
