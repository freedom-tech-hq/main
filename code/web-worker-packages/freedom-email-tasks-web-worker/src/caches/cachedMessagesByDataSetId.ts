import type { ApiViewMessage, DecryptedViewMessage, MailId } from 'freedom-email-api';

import type { MailMessagesDataSetId } from '../types/mail/MailMessagesDataSetId.ts';

export type CachedMessage = { encrypted: true; value: ApiViewMessage } | { encrypted: false; value: DecryptedViewMessage };

export const cachedMessagesByDataSetId = new Map<MailMessagesDataSetId, Map<MailId, CachedMessage>>();
