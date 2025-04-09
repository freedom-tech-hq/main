import type { CustomMailCollectionId } from './CustomMailCollectionId.ts';
import type { MailCollectionType } from './MailCollectionType.ts';

export type CollectionLikeId = Exclude<MailCollectionType, 'custom'> | `custom:${CustomMailCollectionId}` | 'drafts';

export const makeCollectionLikeIdForCollection = ({
  collectionType,
  customId
}: {
  collectionType: MailCollectionType;
  customId?: CustomMailCollectionId;
}): CollectionLikeId => (collectionType === 'custom' ? `custom:${customId!}` : collectionType);
