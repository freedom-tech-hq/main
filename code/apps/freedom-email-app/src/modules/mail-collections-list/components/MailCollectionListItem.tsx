import {
  ArchiveOutlined as ArchiveIcon,
  AutoDeleteOutlined as TrashIcon,
  InboxOutlined as InboxIcon,
  ReportOutlined as SpamIcon,
  SendOutlined as SentIcon
} from '@mui/icons-material';
import type { SvgIconOwnProps } from '@mui/material';
import { Chip, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import type { MailCollection, MailCollectionType } from 'freedom-email-user';
import { makeCollectionLikeIdForCollection } from 'freedom-email-user';
import { useT } from 'freedom-react-localization';
import { useListHasFocus, useVirtualListTheme } from 'freedom-web-virtual-list';
import type { TFunction } from 'i18next';
import type { ComponentType } from 'react';
import { BC, useCallbackRef, useDerivedBinding } from 'react-bindings';

import { useSelectedMailCollectionId } from '../../../contexts/selected-mail-collection.tsx';
import { $mailCollectionType } from '../../../localizations/mail-collection-types.ts';
import type { MailCollectionsListCollectionDataSourceItem } from '../types/MailCollectionsListCollectionDataSourceItem.ts';

export interface MailCollectionListItemProps<TagT> extends Omit<MailCollectionsListCollectionDataSourceItem, 'type'> {
  tag: TagT;
  onClick: (tag: TagT) => void;
}

export const MailCollectionListItem = <TagT,>({ collection, tag, onClick }: MailCollectionListItemProps<TagT>) => {
  const listHasFocus = useListHasFocus();
  const selectedCollectionId = useSelectedMailCollectionId();
  const t = useT();
  const virtualListTheme = useVirtualListTheme();

  const taggedOnClick = useCallbackRef(() => onClick(tag));

  const selectableId = makeCollectionLikeIdForCollection(collection);
  const isSelected = useDerivedBinding(selectedCollectionId, (selectedCollectionId) => selectedCollectionId === selectableId, {
    id: 'isSelected',
    deps: [selectableId]
  });

  const IconComponent = iconComponentsByCollectionType[collection.collectionType];

  return (
    <>
      {BC(isSelected, (isSelected) => (
        <ListItemButton selected={isSelected} onClick={taggedOnClick}>
          <ListItemIcon>
            {BC(listHasFocus, (listHasFocus) => (
              <IconComponent
                sx={{
                  color:
                    virtualListTheme.palette.list[listHasFocus ? 'focused' : 'unfocused'].listItem[isSelected ? 'selected' : 'unselected']
                      .iconColor
                }}
              />
            ))}
          </ListItemIcon>
          <ListItemText
            primary={getTitleForMailCollection(collection, t)}
            slotProps={{ primary: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }}
          />
          {shouldShowUnreadCountByCollectionType[collection.collectionType] ? <Chip size="small" label={collection.unreadCount} /> : null}
        </ListItemButton>
      ))}
    </>
  );
};

// Helpers

const iconComponentsByCollectionType: Record<MailCollectionType, ComponentType<SvgIconOwnProps>> = {
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
