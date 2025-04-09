import type { CustomMailCollectionId } from './CustomMailCollectionId.ts';
import type { MailCollectionType } from './MailCollectionType.ts';

export interface MailCollection {
  readonly collectionType: MailCollectionType;
  readonly customId?: CustomMailCollectionId;
  readonly title: string;
  readonly unreadCount: number;
}
