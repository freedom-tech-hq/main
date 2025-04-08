import {
  ArchiveOutlined as ArchiveIcon,
  AutoDeleteOutlined as TrashIcon,
  DraftsOutlined as DraftsIcon,
  InboxOutlined as InboxIcon,
  ReportOutlined as SpamIcon,
  SendOutlined as SentIcon
} from '@mui/icons-material';
import type { SvgIconOwnProps } from '@mui/material';
import { Chip, ListItemButton, ListItemIcon, ListItemText, useTheme } from '@mui/material';
import type { MailCollectionType } from 'freedom-email-user';
import { useT } from 'freedom-react-localization';
import type { TFunction } from 'i18next';
import type { ComponentType } from 'react';
import { BC, useCallbackRef, useDerivedBinding } from 'react-bindings';

import type { AppTheme } from '../../../components/AppTheme.tsx';
import { useListHasFocus } from '../../../contexts/list-has-focus.tsx';
import { useSelectedMailCollectionId } from '../../../contexts/selected-mail-collection.tsx';
import { $mailCollectionType } from '../../../localizations/mail-collection-types.ts';
import type { MailCollection } from '../../mail-types/MailCollection.ts';
import { makeSelectableMailCollectionId } from '../../mail-types/SelectableMailCollectionId.ts';
import type { MailCollectionsListCollectionDataSourceItem } from '../types/MailCollectionsListCollectionDataSourceItem.ts';

export interface MailCollectionListItemProps<TagT> extends Omit<MailCollectionsListCollectionDataSourceItem, 'type'> {
  tag: TagT;
  onClick: (tag: TagT) => void;
}

export const MailCollectionListItem = <TagT,>({ collection, tag, onClick }: MailCollectionListItemProps<TagT>) => {
  const listHasFocus = useListHasFocus();
  const selectedCollectionId = useSelectedMailCollectionId();
  const t = useT();
  const theme = useTheme<AppTheme>();

  const taggedOnClick = useCallbackRef(() => onClick(tag));

  const selectableId = makeSelectableMailCollectionId(collection);
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
                    theme.palette.list[listHasFocus ? 'focused' : 'unfocused'].listItem[isSelected ? 'selected' : 'unselected'].iconColor
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
  drafts: DraftsIcon,
  inbox: InboxIcon,
  sent: SentIcon,
  spam: SpamIcon,
  trash: TrashIcon,
  custom: InboxIcon
};

const shouldShowUnreadCountByCollectionType: Record<MailCollectionType, boolean> = {
  archive: false,
  drafts: false,
  inbox: true,
  sent: false,
  spam: true,
  trash: false,
  custom: true
};

const getTitleForMailCollection = (collection: MailCollection, t: TFunction) =>
  collection.title.length > 0 ? collection.title : $mailCollectionType[collection.collectionType](t);
