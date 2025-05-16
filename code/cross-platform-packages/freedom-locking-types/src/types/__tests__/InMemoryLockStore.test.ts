import { makeTestsForLockStore } from '../../tests/makeTestsForLockStore.ts';
import { InMemoryLockStore } from '../InMemoryLockStore.ts';

makeTestsForLockStore('InMemoryLockStore', async () => [new InMemoryLockStore<string>(), async () => {}]);
