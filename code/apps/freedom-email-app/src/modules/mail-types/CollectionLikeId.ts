import type { CustomMailCollectionId, MailCollectionType } from 'freedom-email-user';

export type CollectionLikeId = Exclude<MailCollectionType, 'custom'> | `custom:${CustomMailCollectionId}` | 'drafts';

export const makeCollectionLikeIdForCollection = ({
  collectionType,
  customId
}: {
  collectionType: MailCollectionType;
  customId?: CustomMailCollectionId;
}): CollectionLikeId => (collectionType === 'custom' ? `custom:${customId!}` : collectionType);
