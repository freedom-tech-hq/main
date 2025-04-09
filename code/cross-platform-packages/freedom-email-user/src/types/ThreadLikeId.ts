import type { MailId } from 'freedom-email-sync';

import type { MailDraftId } from './MailDraftId.ts';
import type { MailThreadId } from './MailThreadId.ts';

export type ThreadLikeId = MailThreadId | MailId | MailDraftId;
