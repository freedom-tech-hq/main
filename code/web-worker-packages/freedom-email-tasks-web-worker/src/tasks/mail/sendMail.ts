import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure } from 'freedom-async';
import { UnauthorizedError } from 'freedom-common-errors';
import type { ApiInputMessage, MailId } from 'freedom-email-api';

import { useActiveCredential } from '../../contexts/active-credential.ts';

// const saveDraftToRemote = makeApiFetchTask([import.meta.filename, 'saveDraftToRemote'], api.message.draft.POST);
// const sendDraftWithRemote = makeApiFetchTask([import.meta.filename, 'sendDraftWithRemote'], api.message.draft.id.send.POST);

export const sendMail = makeAsyncResultFunc([import.meta.filename], async (trace, _mail: ApiInputMessage): PR<{ mailId: MailId }> => {
  const credential = useActiveCredential(trace);

  if (credential === undefined) {
    return makeFailure(new UnauthorizedError(trace, { message: 'No active user' }));
  }

  return makeFailure(new GeneralError(trace, new Error('not implemented yet')));
  // // TODO: separate saving drafts from sending mail

  // const savedDraft = await saveDraftToRemote(trace, { headers: {}, body: {}, context: getDefaultApiRoutingContext() });
  // if (!savedDraft.ok) {
  //   return savedDraft;
  // }

  // const agentMessage = await encryptMailForServer(trace, mail, credential);
  // if (!agentMessage.ok) {
  //   return agentMessage;
  // }

  // const sentDraft = await sendDraftWithRemote(trace, {
  //   headers: {},
  //   params: { mailId: savedDraft.value.body.id },
  //   body: { agentMessage: agentMessage.value },
  //   context: getDefaultApiRoutingContext()
  // });
});
