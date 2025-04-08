import type { MailCollectionGroupId } from '../../mail-types/MailCollectionGroupId.ts';
import type { CollectionLikeId } from '../../mail-types/CollectionLikeId.ts';

export type MailCollectionsListDataSourceKey = MailCollectionGroupId | `${MailCollectionGroupId}-separator` | CollectionLikeId;
