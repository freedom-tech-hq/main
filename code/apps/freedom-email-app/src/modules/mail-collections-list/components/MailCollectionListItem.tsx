import {
  ArchiveOutlined as ArchiveIcon,
  AutoDeleteOutlined as TrashIcon,
  DraftsOutlined as DraftsIcon,
  InboxOutlined as InboxIcon,
  LabelOutlined as LabelIcon,
  OutboxOutlined as OutboxIcon,
  ReportOutlined as SpamIcon,
  SendOutlined as SentIcon
} from '@mui/icons-material';
import type { SvgIconOwnProps } from '@mui/material';
import { Chip, ListItemButton, ListItemIcon, ListItemText, useTheme } from '@mui/material';
import type { ComponentType } from 'react';
import { BC, useCallbackRef, useDerivedBinding } from 'react-bindings';

import type { AppTheme } from '../../../components/AppTheme.tsx';
import { useListHasFocus } from '../../../contexts/list-has-focus.tsx';
import { useSelectedMailCollectionId } from '../../../contexts/selected-mail-collection.tsx';
import type { MailCollectionType } from '../../mail-types/MailCollectionType.ts';
import type { MailCollectionsListCollectionDataSourceItem } from '../types/MailCollectionsListCollectionDataSourceItem.ts';

export interface MailCollectionListItemProps<TagT> extends Omit<MailCollectionsListCollectionDataSourceItem, 'type'> {
  tag: TagT;
  onClick: (tag: TagT) => void;
}

export const MailCollectionListItem = <TagT,>({ collection, tag, onClick }: MailCollectionListItemProps<TagT>) => {
  const listHasFocus = useListHasFocus();
  const selectedCollectionId = useSelectedMailCollectionId();
  const theme = useTheme<AppTheme>();

  const taggedOnClick = useCallbackRef(() => onClick(tag));

  const isSelected = useDerivedBinding(selectedCollectionId, (selectedCollectionId) => selectedCollectionId === collection.id, {
    id: 'isSelected',
    deps: [collection.id]
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
            primary={collection.title}
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
  label: LabelIcon,
  outbox: OutboxIcon,
  sent: SentIcon,
  spam: SpamIcon,
  trash: TrashIcon
};

const shouldShowUnreadCountByCollectionType: Record<MailCollectionType, boolean> = {
  archive: false,
  drafts: false,
  inbox: true,
  label: true,
  outbox: false,
  sent: false,
  spam: true,
  trash: false
};
