import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { generalizeFailureResult, UnauthorizedError } from 'freedom-common-errors';
import type { DecryptedInputMessage, MailId } from 'freedom-email-api';
import { api, clientApi } from 'freedom-email-api';
import { makeApiFetchTask } from 'freedom-fetching';
import { getDefaultApiRoutingContext } from 'yaschema-api';

import { useActiveCredential } from '../../contexts/active-credential.ts';
import { getPublicKeysForRemote } from '../../internal/tasks/remote/getPublicKeysForRemote.ts';

const saveDraftToRemote = makeApiFetchTask([import.meta.filename, 'saveDraftToRemote'], api.message.draft.POST);
const sendDraftWithRemote = makeApiFetchTask([import.meta.filename, 'sendDraftWithRemote'], api.message.draft.id.send.POST);

export const sendMail = makeAsyncResultFunc([import.meta.filename], async (trace, mail: DecryptedInputMessage): PR<{ mailId: MailId }> => {
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

  const mailEncryptedForRemote = await clientApi.encryptInputMessage(trace, remotePublicKeys.value, mail);
  if (!mailEncryptedForRemote.ok) {
    return mailEncryptedForRemote;
  }

  const savedDraft = await saveDraftToRemote(trace, {
    headers: { authorization: `Bearer ${credential.userId}` },
    body: mailEncryptedForUser.value,
    context: getDefaultApiRoutingContext()
  });
  if (!savedDraft.ok) {
    return savedDraft;
  }

  const sentDraft = await sendDraftWithRemote(trace, {
    headers: { authorization: `Bearer ${credential.userId}` },
    params: { mailId: savedDraft.value.body.id },
    body: { agentMessage: mailEncryptedForRemote.value },
    context: getDefaultApiRoutingContext()
  });
  if (!sentDraft.ok) {
    return generalizeFailureResult(trace, sentDraft, 'not-found');
  }

  return makeSuccess({ mailId: savedDraft.value.body.id });
});
