import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { InternalStateError, UnauthorizedError } from 'freedom-common-errors';
import type { DecryptedInputMessage, MailId } from 'freedom-email-api';
import { api, clientApi } from 'freedom-email-api';
import { makeApiFetchTask } from 'freedom-fetching';
import { getDefaultApiRoutingContext } from 'yaschema-api';

import { useActiveCredential } from '../../contexts/active-credential.ts';
import { getPublicKeysForRemote } from '../../internal/tasks/remote/getPublicKeysForRemote.ts';

const saveDraftToRemote = makeApiFetchTask([import.meta.filename, 'saveDraftToRemote'], api.message.draft.POST);

/** Specify a mail ID to update an existing draft or leave it `undefined` to create a new draft. */
export const saveMailDraft = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, mailId: MailId | undefined, mail: DecryptedInputMessage): PR<{ mailId: MailId }> => {
    if (mailId !== undefined) {
      return makeFailure(new InternalStateError(trace, { message: 'Updating existing drafts is not supported yet' }));
    }

    const credential = useActiveCredential(trace).credential;

    if (credential === undefined) {
      return makeFailure(new UnauthorizedError(trace, { message: 'No active user' }));
    }

    const remotePublicKeys = await getPublicKeysForRemote(trace);
    if (!remotePublicKeys.ok) {
      return remotePublicKeys;
    }

    const mailEncryptedForUser = await clientApi.encryptInputMessage(trace, credential.privateKeys.publicOnly(), mail);
    if (!mailEncryptedForUser.ok) {
      return mailEncryptedForUser;
    }

    const savedDraft = await saveDraftToRemote(trace, {
      headers: { authorization: `Bearer ${credential.userId}` },
      body: mailEncryptedForUser.value,
      context: getDefaultApiRoutingContext()
    });
    if (!savedDraft.ok) {
      return savedDraft;
    }

    return makeSuccess({ mailId: savedDraft.value.body.id });
  }
);
