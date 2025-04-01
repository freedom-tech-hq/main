import './tasks/polyfills.ts';
import './utils/fwd-env.ts';

import { expose } from 'comlink';
import { makeTrace } from 'freedom-contexts';

import type { getMailCollections } from './tasks/modules/mail/getMailCollections.ts';
import type { getMailForThread } from './tasks/modules/mail/getMailForThread.ts';
import type { getMailThreadsForCollection } from './tasks/modules/mail/getMailThreadsForCollection.ts';
import type { createUser } from './tasks/modules/user/createUser.ts';
import type { startSyncServiceForUser } from './tasks/modules/user/startSyncServiceForUser.ts';

export type Tasks = Omit<InstanceType<typeof TasksImpl>, '#trace'>;

type Rest<T> = T extends [any, ...infer U] ? U : never;
type ParametersExceptFirst<T extends (...args: any) => any> = Rest<Parameters<T>>;

class TasksImpl {
  readonly #trace = makeTrace('worker');

  // Mail
  public readonly getMailForThread = async (...args: ParametersExceptFirst<typeof getMailForThread>) =>
    await (await import('./tasks/modules/mail/getMailForThread.ts')).getMailForThread(this.#trace, ...args);
  public readonly getMailCollections = async (...args: ParametersExceptFirst<typeof getMailCollections>) =>
    await (await import('./tasks/modules/mail/getMailCollections.ts')).getMailCollections(this.#trace, ...args);
  public readonly getMailThreadsForCollection = async (...args: ParametersExceptFirst<typeof getMailThreadsForCollection>) =>
    await (await import('./tasks/modules/mail/getMailThreadsForCollection.ts')).getMailThreadsForCollection(this.#trace, ...args);

  // User
  public readonly createUser = async (...args: ParametersExceptFirst<typeof createUser>) =>
    await (await import('./tasks/modules/user/createUser.ts')).createUser(this.#trace, ...args);
  public readonly startSyncServiceForUser = async (...args: ParametersExceptFirst<typeof startSyncServiceForUser>) =>
    await (await import('./tasks/modules/user/startSyncServiceForUser.ts')).startSyncServiceForUser(this.#trace, ...args);
}

expose(TasksImpl);

console.log('Loaded tasks', process.env.FREEDOM_BUILD_UUID);
