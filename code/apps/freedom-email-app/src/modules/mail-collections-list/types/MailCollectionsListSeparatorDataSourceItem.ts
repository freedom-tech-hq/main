import type { MailCollectionGroupId } from '../../mail-types/MailCollectionGroupId.ts';

export interface MailCollectionsListSeparatorDataSourceItem {
  type: 'separator';
  id: `${MailCollectionGroupId}-separator`;
}
