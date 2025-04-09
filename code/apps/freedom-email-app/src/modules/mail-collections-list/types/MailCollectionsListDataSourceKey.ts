import type { CollectionLikeId, MailCollectionGroupId } from 'freedom-email-user';

export type MailCollectionsListDataSourceKey = MailCollectionGroupId | `${MailCollectionGroupId}-separator` | CollectionLikeId;
