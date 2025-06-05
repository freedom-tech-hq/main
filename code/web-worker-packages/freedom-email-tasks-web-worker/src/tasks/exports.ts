import '../internal/polyfills.ts';

import { expose } from 'comlink';
import { makeTrace } from 'freedom-contexts';

import type { setConfig } from './config/config.ts';
import type { setDemoMode } from './config/demo-mode.ts';
import type { devFwdEnv } from './dev/devFwdEnv.ts';
import type { activateUserWithLocallyStoredEncryptedEmailCredential } from './email-credential/activateUserWithLocallyStoredEncryptedEmailCredential.ts';
import type { addEncryptionForBiometricsToLocallyStoredEmailCredential } from './email-credential/addEncryptionForBiometricsToLocallyStoredEmailCredential.ts';
import type { deactivateUser } from './email-credential/deactivateUser.ts';
import type { getLocallyStoredEncryptedEmailCredential } from './email-credential/getLocallyStoredEncryptedEmailCredential.ts';
import type { getLocallyStoredEncryptedEmailCredentialInfoByEmail } from './email-credential/getLocallyStoredEncryptedEmailCredentialInfoByEmail.ts';
import type { importEmailCredential } from './email-credential/importEmailCredential.ts';
import type { importEmailCredentialFromRemote } from './email-credential/importEmailCredentialFromRemote.ts';
import type { listLocallyStoredEncryptedEmailCredentials } from './email-credential/listLocallyStoredEncryptedEmailCredentials.ts';
import type { removeEncryptionForBiometricsFromLocallyStoredEmailCredential } from './email-credential/removeEncryptionForBiometricsFromLocallyStoredEmailCredential.ts';
import type { removeLocallyStoredEncryptedEmailCredential } from './email-credential/removeLocallyStoredEncryptedEmailCredential.ts';
import type { storeCredentialsOnServer } from './email-credential/storeCredentialsOnServer.ts';
import type { getMail } from './mail/getMail.ts';
import type { getMailIdsForThread } from './mail/getMailIdsForThread.ts';
import type { getMailThread } from './mail/getMailThread.ts';
import type { getMailThreadIdsForMessageFolder } from './mail/getMailThreadIdsForMessageFolder.ts';
import type { getMessageFolders } from './mail/getMessageFolders.ts';
import type { sendMail } from './mail/sendMail.ts';
import type { checkEmailAvailability } from './user/checkEmailAvailability.ts';
import type { createUser } from './user/createUser.ts';

export type Tasks = Omit<InstanceType<typeof TasksImpl>, '#trace'>;

type Rest<T> = T extends [any, ...infer U] ? U : never;
type ParametersExceptFirst<T extends (...args: any) => any> = Rest<Parameters<T>>;

class TasksImpl {
  readonly #trace = makeTrace('worker');

  // Config

  public readonly setConfig = async (...args: ParametersExceptFirst<typeof setConfig>) =>
    await (await import('./config/config.ts')).setConfig(this.#trace, ...args);
  public readonly setDemoMode = async (...args: ParametersExceptFirst<typeof setDemoMode>) =>
    await (await import('./config/demo-mode.ts')).setDemoMode(this.#trace, ...args);

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

  public readonly addEncryptionForBiometricsToLocallyStoredEmailCredential = async (
    ...args: ParametersExceptFirst<typeof addEncryptionForBiometricsToLocallyStoredEmailCredential>
  ) =>
    await (
      await import('./email-credential/addEncryptionForBiometricsToLocallyStoredEmailCredential.ts')
    ).addEncryptionForBiometricsToLocallyStoredEmailCredential(this.#trace, ...args);

  public readonly deactivateUser = async (...args: ParametersExceptFirst<typeof deactivateUser>) =>
    await (await import('./email-credential/deactivateUser.ts')).deactivateUser(this.#trace, ...args);

  public readonly getLocallyStoredEncryptedEmailCredential = async (
    ...args: ParametersExceptFirst<typeof getLocallyStoredEncryptedEmailCredential>
  ) =>
    await (
      await import('./email-credential/getLocallyStoredEncryptedEmailCredential.ts')
    ).getLocallyStoredEncryptedEmailCredential(this.#trace, ...args);

  public readonly getLocallyStoredEncryptedEmailCredentialInfoByEmail = async (
    ...args: ParametersExceptFirst<typeof getLocallyStoredEncryptedEmailCredentialInfoByEmail>
  ) =>
    await (
      await import('./email-credential/getLocallyStoredEncryptedEmailCredentialInfoByEmail.ts')
    ).getLocallyStoredEncryptedEmailCredentialInfoByEmail(this.#trace, ...args);

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

  public readonly getMail = async (...args: ParametersExceptFirst<typeof getMail>) =>
    await (await import('./mail/getMail.ts')).getMail(this.#trace, ...args);

  public readonly getMailIdsForThread = async (...args: ParametersExceptFirst<typeof getMailIdsForThread>) =>
    await (await import('./mail/getMailIdsForThread.ts')).getMailIdsForThread(this.#trace, ...args);

  public readonly getMailThread = async (...args: ParametersExceptFirst<typeof getMailThread>) =>
    await (await import('./mail/getMailThread.ts')).getMailThread(this.#trace, ...args);

  public readonly getMailThreadIdsForMessageFolder = async (...args: ParametersExceptFirst<typeof getMailThreadIdsForMessageFolder>) =>
    await (await import('./mail/getMailThreadIdsForMessageFolder.ts')).getMailThreadIdsForMessageFolder(this.#trace, ...args);

  public readonly getMessageFolders = async (...args: ParametersExceptFirst<typeof getMessageFolders>) =>
    await (await import('./mail/getMessageFolders.ts')).getMessageFolders(this.#trace, ...args);

  public readonly sendMail = async (...args: ParametersExceptFirst<typeof sendMail>) =>
    await (await import('./mail/sendMail.ts')).sendMail(this.#trace, ...args);

  // User

  public readonly checkEmailAvailability = async (...args: ParametersExceptFirst<typeof checkEmailAvailability>) =>
    await (await import('./user/checkEmailAvailability.ts')).checkEmailAvailability(this.#trace, ...args);

  public readonly createUser = async (...args: ParametersExceptFirst<typeof createUser>) =>
    await (await import('./user/createUser.ts')).createUser(this.#trace, ...args);
}

expose(TasksImpl);

console.log('Loaded tasks');
