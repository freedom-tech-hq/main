import type { MailId } from 'freedom-email-sync';
import { mailIdInfo } from 'freedom-email-sync';

import type { MailDraftId } from './MailDraftId.ts';
import { mailDraftIdInfo } from './MailDraftId.ts';
import type { MailThreadId } from './MailThreadId.ts';
import { mailThreadIdInfo } from './MailThreadId.ts';

export type ThreadLikeId = MailThreadId | MailId | MailDraftId;
export const nonAnchoredThreadLikeIdRegex = new RegExp(
  `(?:${mailThreadIdInfo.nonAnchoredRegex.source})|(?:${mailIdInfo.nonAnchoredRegex.source})|(?:${mailDraftIdInfo.nonAnchoredRegex.source})`
);
