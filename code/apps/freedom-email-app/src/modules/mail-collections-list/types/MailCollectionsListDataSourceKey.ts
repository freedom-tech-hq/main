import type { MailCollectionGroupId } from '../../mail-types/MailCollectionGroupId.ts';
import type { MailCollectionId } from '../../mail-types/MailCollectionId.ts';

export type MailCollectionsListDataSourceKey = MailCollectionGroupId | `${MailCollectionGroupId}-separator` | MailCollectionId;
