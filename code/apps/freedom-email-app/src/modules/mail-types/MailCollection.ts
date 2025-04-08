import type { CustomMailCollectionId, MailCollectionType } from 'freedom-email-user';

export interface MailCollection {
  readonly collectionType: MailCollectionType;
  readonly customId?: CustomMailCollectionId;
  readonly title: string;
  readonly unreadCount: number;
}
