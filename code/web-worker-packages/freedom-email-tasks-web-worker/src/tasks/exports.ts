import '../internal/polyfills.ts';

import { expose } from 'comlink';
import { makeTrace } from 'freedom-contexts';

import type { devFwdEnv } from './dev/devFwdEnv.ts';
import type { activateUserWithLocallyStoredEncryptedEmailCredential } from './email-credential/activateUserWithLocallyStoredEncryptedEmailCredential.ts';
import type { listLocallyStoredEncryptedEmailCredentials } from './email-credential/listLocallyStoredEncryptedEmailCredentials.ts';
import type { createMailDraft } from './mail/createMailDraft.ts';
import type { getMailCollections } from './mail/getMailCollections.ts';
import type { getMailForThread } from './mail/getMailForThread.ts';
import type { getMailThreadsForCollection } from './mail/getMailThreadsForCollection.ts';
import type { createUser } from './user/createUser.ts';
import type { restoreUser } from './user/restoreUser.ts';
import type { startSyncService } from './user/startSyncService.ts';

export type Tasks = Omit<InstanceType<typeof TasksImpl>, '#trace'>;

type Rest<T> = T extends [any, ...infer U] ? U : never;
type ParametersExceptFirst<T extends (...args: any) => any> = Rest<Parameters<T>>;

class TasksImpl {
  readonly #trace = makeTrace('worker');

  // Dev
  public readonly devFwdEnv = async (...args: ParametersExceptFirst<typeof devFwdEnv>) =>
    await (await import('./dev/devFwdEnv.ts')).devFwdEnv(this.#trace, ...args);

  // Email Credential
  public readonly activateUserWithLocallyStoredEncryptedEmailCredentials = async (
    ...args: ParametersExceptFirst<typeof activateUserWithLocallyStoredEncryptedEmailCredential>
  ) =>
    await (
      await import('./email-credential/activateUserWithLocallyStoredEncryptedEmailCredential.ts')
    ).activateUserWithLocallyStoredEncryptedEmailCredential(this.#trace, ...args);
  public readonly listLocallyStoredEncryptedEmailCredentials = async (
    ...args: ParametersExceptFirst<typeof listLocallyStoredEncryptedEmailCredentials>
  ) =>
    await (
      await import('./email-credential/listLocallyStoredEncryptedEmailCredentials.ts')
    ).listLocallyStoredEncryptedEmailCredentials(this.#trace, ...args);

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
  public readonly startSyncService = async (...args: ParametersExceptFirst<typeof startSyncService>) =>
    await (await import('./user/startSyncService.ts')).startSyncService(this.#trace, ...args);
}

expose(TasksImpl);

console.log('Loaded tasks');
