import type { MailCollectionGroupId } from '../../mail-types/MailCollectionGroupId.ts';
import type { SelectableMailCollectionId } from '../../mail-types/SelectableMailCollectionId.ts';

export type MailCollectionsListDataSourceKey = MailCollectionGroupId | `${MailCollectionGroupId}-separator` | SelectableMailCollectionId;
