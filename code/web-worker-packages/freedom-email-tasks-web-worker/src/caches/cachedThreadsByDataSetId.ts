import type { ApiThread, DecryptedThread, MailThreadLikeId } from 'freedom-email-api';

import type { MailThreadsDataSetId } from '../types/mail/MailThreadsDataSetId.ts';

export type CachedThread = { encrypted: true; value: ApiThread } | { encrypted: false; value: DecryptedThread };

export const cachedThreadsByDataSetId = new Map<MailThreadsDataSetId, Map<MailThreadLikeId, CachedThread>>();
