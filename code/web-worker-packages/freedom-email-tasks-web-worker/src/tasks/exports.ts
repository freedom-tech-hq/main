import '../internal/polyfills.ts';

import { expose } from 'comlink';
import { makeTrace } from 'freedom-contexts';

import type { setConfig } from './config/setConfig.ts';
import type { devFwdEnv } from './dev/devFwdEnv.ts';
import type { logUserFsLs } from './dev/logUserFsLs.ts';
import type { activateUserWithLocallyStoredEncryptedEmailCredential } from './email-credential/activateUserWithLocallyStoredEncryptedEmailCredential.ts';
import type { addEncryptionForBiometricsToLocallyStoredEmailCredential } from './email-credential/addEncryptionForBiometricsToLocallyStoredEmailCredential.ts';
import type { getLocallyStoredEncryptedEmailCredential } from './email-credential/getLocallyStoredEncryptedEmailCredential.ts';
import type { importEmailCredential } from './email-credential/importEmailCredential.ts';
import type { importEmailCredentialFromRemote } from './email-credential/importEmailCredentialFromRemote.ts';
import type { listLocallyStoredEncryptedEmailCredentials } from './email-credential/listLocallyStoredEncryptedEmailCredentials.ts';
import type { removeEncryptionForBiometricsFromLocallyStoredEmailCredential } from './email-credential/removeEncryptionForBiometricsFromLocallyStoredEmailCredential.ts';
import type { removeLocallyStoredEncryptedEmailCredential } from './email-credential/removeLocallyStoredEncryptedEmailCredential.ts';
import type { storeCredentialsOnServer } from './email-credential/storeCredentialsOnServer.ts';
import type { createMailDraft } from './mail/createMailDraft.ts';
import type { getMailCollections } from './mail/getMailCollections.ts';
import type { getMailForThread } from './mail/getMailForThread.ts';
import type { getMailThread } from './mail/getMailThread.ts';
import type { getMailThreadsForCollection } from './mail/getMailThreadsForCollection.ts';
import type { sendMail } from './mail/sendMail.ts';
import type { checkEmailAvailability } from './user/checkEmailAvailability.ts';
import type { createUser } from './user/createUser.ts';
import type { startSyncService } from './user/startSyncService.ts';

export type Tasks = Omit<InstanceType<typeof TasksImpl>, '#trace'>;

type Rest<T> = T extends [any, ...infer U] ? U : never;
type ParametersExceptFirst<T extends (...args: any) => any> = Rest<Parameters<T>>;

class TasksImpl {
  readonly #trace = makeTrace('worker');

  // Config

  public readonly setConfig = async (...args: ParametersExceptFirst<typeof setConfig>) =>
    await (await import('./config/setConfig.ts')).setConfig(this.#trace, ...args);

  // Dev

  public readonly devFwdEnv = async (...args: ParametersExceptFirst<typeof devFwdEnv>) =>
    await (await import('./dev/devFwdEnv.ts')).devFwdEnv(this.#trace, ...args);

  public readonly logUserFsLs = async (...args: ParametersExceptFirst<typeof logUserFsLs>) =>
    await (await import('./dev/logUserFsLs.ts')).logUserFsLs(this.#trace, ...args);

  // Email Credential

  public readonly activateUserWithLocallyStoredEncryptedEmailCredentials = async (
    ...args: ParametersExceptFirst<typeof activateUserWithLocallyStoredEncryptedEmailCredential>
  ) =>
    await (
      await import('./email-credential/activateUserWithLocallyStoredEncryptedEmailCredential.ts')
    ).activateUserWithLocallyStoredEncryptedEmailCredential(this.#trace, ...args);

  public readonly addEncryptionForBiometricsToLocallyStoredEmailCredential = async (
    ...args: ParametersExceptFirst<typeof addEncryptionForBiometricsToLocallyStoredEmailCredential>
  ) =>
    await (
      await import('./email-credential/addEncryptionForBiometricsToLocallyStoredEmailCredential.ts')
    ).addEncryptionForBiometricsToLocallyStoredEmailCredential(this.#trace, ...args);

  public readonly getLocallyStoredEncryptedEmailCredential = async (
    ...args: ParametersExceptFirst<typeof getLocallyStoredEncryptedEmailCredential>
  ) =>
    await (
      await import('./email-credential/getLocallyStoredEncryptedEmailCredential.ts')
    ).getLocallyStoredEncryptedEmailCredential(this.#trace, ...args);

  public readonly importEmailCredential = async (...args: ParametersExceptFirst<typeof importEmailCredential>) =>
    await (await import('./email-credential/importEmailCredential.ts')).importEmailCredential(this.#trace, ...args);

  public readonly importEmailCredentialFromRemote = async (...args: ParametersExceptFirst<typeof importEmailCredentialFromRemote>) =>
    await (await import('./email-credential/importEmailCredentialFromRemote.ts')).importEmailCredentialFromRemote(this.#trace, ...args);

  public readonly listLocallyStoredEncryptedEmailCredentials = async (
    ...args: ParametersExceptFirst<typeof listLocallyStoredEncryptedEmailCredentials>
  ) =>
    await (
      await import('./email-credential/listLocallyStoredEncryptedEmailCredentials.ts')
    ).listLocallyStoredEncryptedEmailCredentials(this.#trace, ...args);

  public readonly removeEncryptionForBiometricsFromLocallyStoredEmailCredential = async (
    ...args: ParametersExceptFirst<typeof removeEncryptionForBiometricsFromLocallyStoredEmailCredential>
  ) =>
    await (
      await import('./email-credential/removeEncryptionForBiometricsFromLocallyStoredEmailCredential.ts')
    ).removeEncryptionForBiometricsFromLocallyStoredEmailCredential(this.#trace, ...args);

  public readonly removeLocallyStoredEncryptedEmailCredential = async (
    ...args: ParametersExceptFirst<typeof removeLocallyStoredEncryptedEmailCredential>
  ) =>
    await (
      await import('./email-credential/removeLocallyStoredEncryptedEmailCredential.ts')
    ).removeLocallyStoredEncryptedEmailCredential(this.#trace, ...args);

  public readonly storeCredentialsOnServer = async (...args: ParametersExceptFirst<typeof storeCredentialsOnServer>) =>
    await (await import('./email-credential/storeCredentialsOnServer.ts')).storeCredentialsOnServer(this.#trace, ...args);

  // Mail

  public readonly createMailDraft = async (...args: ParametersExceptFirst<typeof createMailDraft>) =>
    await (await import('./mail/createMailDraft.ts')).createMailDraft(this.#trace, ...args);

  public readonly getMailForThread = async (...args: ParametersExceptFirst<typeof getMailForThread>) =>
    await (await import('./mail/getMailForThread.ts')).getMailForThread(this.#trace, ...args);

  public readonly getMailCollections = async (...args: ParametersExceptFirst<typeof getMailCollections>) =>
    await (await import('./mail/getMailCollections.ts')).getMailCollections(this.#trace, ...args);

  public readonly getMailThread = async (...args: ParametersExceptFirst<typeof getMailThread>) =>
    await (await import('./mail/getMailThread.ts')).getMailThread(this.#trace, ...args);

  public readonly getMailThreadsForCollection = async (...args: ParametersExceptFirst<typeof getMailThreadsForCollection>) =>
    await (await import('./mail/getMailThreadsForCollection.ts')).getMailThreadsForCollection(this.#trace, ...args);

  public readonly sendMail = async (...args: ParametersExceptFirst<typeof sendMail>) =>
    await (await import('./mail/sendMail.ts')).sendMail(this.#trace, ...args);

  // User

  public readonly checkEmailAvailability = async (...args: ParametersExceptFirst<typeof checkEmailAvailability>) =>
    await (await import('./user/checkEmailAvailability.ts')).checkEmailAvailability(this.#trace, ...args);

  public readonly createUser = async (...args: ParametersExceptFirst<typeof createUser>) =>
    await (await import('./user/createUser.ts')).createUser(this.#trace, ...args);

  public readonly startSyncService = async (...args: ParametersExceptFirst<typeof startSyncService>) =>
    await (await import('./user/startSyncService.ts')).startSyncService(this.#trace, ...args);
}

expose(TasksImpl);

console.log('Loaded tasks');
