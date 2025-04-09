import type { MailCollection } from './MailCollection.ts';
import type { MailCollectionGroupId } from './MailCollectionGroupId.ts';

export interface MailCollectionGroup {
  readonly id: MailCollectionGroupId;
  readonly title?: string;
  readonly collections: MailCollection[];
}
