import '../internal/polyfills.ts';

import { expose } from 'comlink';
import type { PRFunc } from 'freedom-async';
import { makeTrace } from 'freedom-contexts';
import type { WrappedResult } from 'react-waitables';

export type Tasks = Omit<InstanceType<typeof TasksImpl>, '#trace'>;

const trace = makeTrace('worker');

const wrapPrFunc =
  <ArgsT extends any[], SuccessT, ErrorCodeT extends string>(loadPrFunc: () => Promise<PRFunc<SuccessT, ErrorCodeT, ArgsT>>) =>
  async (...args: ArgsT): Promise<WrappedResult<SuccessT, { errorCode: ErrorCodeT | 'generic' }>> => {
    const result = await (await loadPrFunc())(trace, ...args);
    if (!result.ok) {
      return { ok: false, value: { errorCode: result.value.errorCode } };
    }

    return result;
  };

class TasksImpl {
  // Config

  public readonly setConfig = wrapPrFunc(async () => (await import('./config/config.ts')).setConfig);

  public readonly setDemoMode = wrapPrFunc(async () => (await import('./config/demo-mode.ts')).setDemoMode);

  // Dev

  public readonly devFwdEnv = wrapPrFunc(async () => (await import('./dev/devFwdEnv.ts')).devFwdEnv);

  // Email Credential

  public readonly activateUserWithLocallyStoredEncryptedEmailCredentials = wrapPrFunc(
    async () =>
      (await import('./email-credential/activateUserWithLocallyStoredEncryptedEmailCredential.ts'))
        .activateUserWithLocallyStoredEncryptedEmailCredential
  );

  public readonly addEncryptionForBiometricsToLocallyStoredEmailCredential = wrapPrFunc(
    async () =>
      (await import('./email-credential/addEncryptionForBiometricsToLocallyStoredEmailCredential.ts'))
        .addEncryptionForBiometricsToLocallyStoredEmailCredential
  );

  public readonly deactivateUser = wrapPrFunc(async () => (await import('./email-credential/deactivateUser.ts')).deactivateUser);

  public readonly getLocallyStoredEncryptedEmailCredential = wrapPrFunc(
    async () => (await import('./email-credential/getLocallyStoredEncryptedEmailCredential.ts')).getLocallyStoredEncryptedEmailCredential
  );

  public readonly getLocallyStoredEncryptedEmailCredentialInfoByEmail = wrapPrFunc(
    async () =>
      (await import('./email-credential/getLocallyStoredEncryptedEmailCredentialInfoByEmail.ts'))
        .getLocallyStoredEncryptedEmailCredentialInfoByEmail
  );

  public readonly importEmailCredential = wrapPrFunc(
    async () => (await import('./email-credential/importEmailCredential.ts')).importEmailCredential
  );

  public readonly importEmailCredentialFromRemote = wrapPrFunc(
    async () => (await import('./email-credential/importEmailCredentialFromRemote.ts')).importEmailCredentialFromRemote
  );

  public readonly listLocallyStoredEncryptedEmailCredentials = wrapPrFunc(
    async () =>
      (await import('./email-credential/listLocallyStoredEncryptedEmailCredentials.ts')).listLocallyStoredEncryptedEmailCredentials
  );

  public readonly removeEncryptionForBiometricsFromLocallyStoredEmailCredential = wrapPrFunc(
    async () =>
      (await import('./email-credential/removeEncryptionForBiometricsFromLocallyStoredEmailCredential.ts'))
        .removeEncryptionForBiometricsFromLocallyStoredEmailCredential
  );

  public readonly removeLocallyStoredEncryptedEmailCredential = wrapPrFunc(
    async () =>
      (await import('./email-credential/removeLocallyStoredEncryptedEmailCredential.ts')).removeLocallyStoredEncryptedEmailCredential
  );

  public readonly storeCredentialsOnServer = wrapPrFunc(
    async () => (await import('./email-credential/storeCredentialsOnServer.ts')).storeCredentialsOnServer
  );

  // Mail

  public readonly getMail = wrapPrFunc(async () => (await import('./mail/getMail.ts')).getMail);

  public readonly getMailInfosForThread = wrapPrFunc(async () => (await import('./mail/getMailInfosForThread.ts')).getMailInfosForThread);

  public readonly getMailThread = wrapPrFunc(async () => (await import('./mail/getMailThread.ts')).getMailThread);

  public readonly getMailThreadInfosForMessageFolder = wrapPrFunc(
    async () => (await import('./mail/getMailThreadInfosForMessageFolder.ts')).getMailThreadInfosForMessageFolder
  );

  public readonly getMessageFolders = wrapPrFunc(async () => (await import('./mail/getMessageFolders.ts')).getMessageFolders);

  public readonly loadMoreMailIds = wrapPrFunc(async () => (await import('./mail/loadMoreMailIds.ts')).loadMoreMailIds);

  public readonly loadMoreMailThreadIds = wrapPrFunc(async () => (await import('./mail/loadMoreMailThreadIds.ts')).loadMoreMailThreadIds);

  public readonly sendMail = wrapPrFunc(async () => (await import('./mail/sendMail.ts')).sendMail);

  // User

  public readonly checkEmailAvailability = wrapPrFunc(
    async () => (await import('./user/checkEmailAvailability.ts')).checkEmailAvailability
  );

  public readonly createUser = wrapPrFunc(async () => (await import('./user/createUser.ts')).createUser);
}

expose(TasksImpl);

console.log('Loaded tasks');
