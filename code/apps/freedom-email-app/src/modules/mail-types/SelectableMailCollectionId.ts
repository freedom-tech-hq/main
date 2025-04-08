import type { CustomMailCollectionId, MailCollectionType } from 'freedom-email-user';

export type SelectableMailCollectionId = Exclude<MailCollectionType, 'custom'> | `custom:${CustomMailCollectionId}`;

export const makeSelectableMailCollectionId = ({
  collectionType,
  customId
}: {
  collectionType: MailCollectionType;
  customId?: CustomMailCollectionId;
}): SelectableMailCollectionId => (collectionType === 'custom' ? `custom:${customId!}` : collectionType);
