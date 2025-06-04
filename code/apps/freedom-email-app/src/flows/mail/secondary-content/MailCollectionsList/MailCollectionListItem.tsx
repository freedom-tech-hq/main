import type { SvgIconComponent } from '@mui/icons-material';
import { Chip, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import type { MailCollection, MailCollectionType } from 'freedom-email-user';
import { makeCollectionLikeIdForCollection } from 'freedom-email-user';
import { useT } from 'freedom-react-localization';
import type { TFunction } from 'i18next';
import React from 'react';
import { BC, useCallbackRef, useDerivedBinding } from 'react-bindings';

import { useSelectedMailCollectionId } from '../../../../contexts/selected-mail-collection.tsx';
import { ArchiveIcon } from '../../../../icons/ArchiveIcon.ts';
import { InboxIcon } from '../../../../icons/InboxIcon.ts';
import { SentIcon } from '../../../../icons/SentIcon.ts';
import { SpamIcon } from '../../../../icons/SpamIcon.ts';
import { TrashIcon } from '../../../../icons/TrashIcon.ts';
import { $mailCollectionType } from '../../../../localizations/mail-collection-types.ts';
import type { MailCollectionsListCollectionDataSourceItem } from './MailCollectionsListCollectionDataSourceItem.ts';

export interface MailCollectionListItemProps<TagT> extends Omit<MailCollectionsListCollectionDataSourceItem, 'type'> {
  tag: TagT;
  onClick: (tag: TagT) => void;
}

export const MailCollectionListItem = <TagT,>({ collection, tag, onClick }: MailCollectionListItemProps<TagT>) => {
  const selectedCollectionId = useSelectedMailCollectionId();
  const t = useT();

  const taggedOnClick = useCallbackRef(() => onClick(tag));

  const selectableId = makeCollectionLikeIdForCollection(collection);
  const isSelected = useDerivedBinding(selectedCollectionId, (selectedCollectionId) => selectedCollectionId === selectableId, {
    id: 'isSelected',
    deps: [selectableId]
  });

  const IconComponent = iconComponentsByCollectionType[collection.collectionType];

  return BC(isSelected, (isSelected) => (
    <ListItemButton selected={isSelected} onClick={taggedOnClick} className="mail-collection-list-item">
      <ListItemIcon>
        <IconComponent className="sm-icon" />
      </ListItemIcon>
      <ListItemText
        primary={getTitleForMailCollection(collection, t)}
        slotProps={{
          primary: { variant: 'body2', className: 'medium', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
        }}
      />
      {shouldShowUnreadCountByCollectionType[collection.collectionType] ? (
        <Chip className={`mail-collection-list-item-chip-${isSelected ? 'selected' : 'not-selected'}`} label={collection.unreadCount} />
      ) : null}
    </ListItemButton>
  ));
};

// Helpers

const iconComponentsByCollectionType: Record<MailCollectionType, SvgIconComponent> = {
  archive: ArchiveIcon,
  inbox: InboxIcon,
  sent: SentIcon,
  spam: SpamIcon,
  trash: TrashIcon,
  custom: InboxIcon
};

const shouldShowUnreadCountByCollectionType: Record<MailCollectionType, boolean> = {
  archive: false,
  inbox: true,
  sent: false,
  spam: true,
  trash: false,
  custom: true
};

const getTitleForMailCollection = (collection: MailCollection, t: TFunction) =>
  collection.title.length > 0 ? collection.title : $mailCollectionType[collection.collectionType](t);
