import type { StoredMail } from 'freedom-email-sync';

import type { MailDraftDocument } from '../types/MailDraftDocument.ts';

export const makeMailFromDraft = (draftDoc: MailDraftDocument): StoredMail => {
  // TODO: attachments should be copied into the outbox
  return {
    from: 'test@freedommail.me', // TODO: TEMP
    to: Array.from(draftDoc.to.values()),
    cc: Array.from(draftDoc.cc.values()),
    bcc: Array.from(draftDoc.bcc.values()),
    timeMSec: Date.now(),
    subject: draftDoc.subject.getString(),
    body: draftDoc.body.getString(),
    attachments: []
  };
};
