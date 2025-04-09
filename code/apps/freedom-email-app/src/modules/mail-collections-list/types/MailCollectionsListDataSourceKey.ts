import type { CollectionLikeId } from '../../mail-types/CollectionLikeId.ts';
import type { MailCollectionGroupId } from '../../mail-types/MailCollectionGroupId.ts';

export type MailCollectionsListDataSourceKey = MailCollectionGroupId | `${MailCollectionGroupId}-separator` | CollectionLikeId;
