import '../internal/polyfills.ts';
import '../internal/utils/fwd-env.ts';

import { expose } from 'comlink';
import { makeTrace } from 'freedom-contexts';

import type { createMailDraft } from './mail/createMailDraft.ts';
import type { getMailCollections } from './mail/getMailCollections.ts';
import type { getMailForThread } from './mail/getMailForThread.ts';
import type { getMailThreadsForCollection } from './mail/getMailThreadsForCollection.ts';
import type { createUser } from './user/createUser.ts';
import type { restoreUser } from './user/restoreUser.ts';
import type { startSyncServiceForUser } from './user/startSyncServiceForUser.ts';

export type Tasks = Omit<InstanceType<typeof TasksImpl>, '#trace'>;

type Rest<T> = T extends [any, ...infer U] ? U : never;
type ParametersExceptFirst<T extends (...args: any) => any> = Rest<Parameters<T>>;

class TasksImpl {
  readonly #trace = makeTrace('worker');

  // Mail
  public readonly createMailDraft = async (...args: ParametersExceptFirst<typeof createMailDraft>) =>
    await (await import('./mail/createMailDraft.ts')).createMailDraft(this.#trace, ...args);
  public readonly getMailForThread = async (...args: ParametersExceptFirst<typeof getMailForThread>) =>
    await (await import('./mail/getMailForThread.ts')).getMailForThread(this.#trace, ...args);
  public readonly getMailCollections = async (...args: ParametersExceptFirst<typeof getMailCollections>) =>
    await (await import('./mail/getMailCollections.ts')).getMailCollections(this.#trace, ...args);
  public readonly getMailThreadsForCollection = async (...args: ParametersExceptFirst<typeof getMailThreadsForCollection>) =>
    await (await import('./mail/getMailThreadsForCollection.ts')).getMailThreadsForCollection(this.#trace, ...args);

  // User
  public readonly createUser = async (...args: ParametersExceptFirst<typeof createUser>) =>
    await (await import('./user/createUser.ts')).createUser(this.#trace, ...args);
  public readonly restoreUser = async (...args: ParametersExceptFirst<typeof restoreUser>) =>
    await (await import('./user/restoreUser.ts')).restoreUser(this.#trace, ...args);
  public readonly startSyncServiceForUser = async (...args: ParametersExceptFirst<typeof startSyncServiceForUser>) =>
    await (await import('./user/startSyncServiceForUser.ts')).startSyncServiceForUser(this.#trace, ...args);
}

expose(TasksImpl);

console.log('Loaded tasks');
