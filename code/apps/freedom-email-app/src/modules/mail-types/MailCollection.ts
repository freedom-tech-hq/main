import type { MailCollectionId } from './MailCollectionId.ts';
import type { MailCollectionType } from './MailCollectionType.ts';

export interface MailCollection {
  readonly id: MailCollectionId;
  readonly collectionType: MailCollectionType;
  readonly title: string;
  readonly unreadCount: number;
}
