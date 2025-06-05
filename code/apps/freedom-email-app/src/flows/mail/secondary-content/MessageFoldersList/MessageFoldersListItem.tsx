import type { SvgIconComponent } from '@mui/icons-material';
import { Chip, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import type { MessageFolder } from 'freedom-email-api';
import { useT } from 'freedom-react-localization';
import { type TFunction } from 'i18next';
import React from 'react';
import { BC, useCallbackRef, useDerivedBinding } from 'react-bindings';

import { IconPlaceholder } from '../../../../components/reusable/IconPlaceholder.tsx';
import { TxtPlaceholder } from '../../../../components/reusable/TxtPlaceholder.tsx';
import { $messageFolder } from '../../../../consts/common-strings.ts';
import { useSelectedMessageFolder } from '../../../../contexts/selected-message-folder.tsx';
import { DraftIcon } from '../../../../icons/DraftIcon.ts';
import { InboxIcon } from '../../../../icons/InboxIcon.ts';
import { OutboxIcon } from '../../../../icons/OutboxIcon.ts';
import { SentIcon } from '../../../../icons/SentIcon.ts';
import type { MessageFoldersListFolderDataSourceItem } from './MessageFoldersListFolderDataSourceItem.ts';

export interface MessageFoldersListItemProps<TagT> extends Omit<MessageFoldersListFolderDataSourceItem, 'type'> {
  tag: TagT;
  onClick: (tag: TagT) => void;
}

export const MessageFoldersListItem = <TagT,>({ folder, unreadCount, tag, onClick }: MessageFoldersListItemProps<TagT>) => {
  const selectedMessageFolder = useSelectedMessageFolder();
  const t = useT();

  const taggedOnClick = useCallbackRef(() => onClick(tag));

  const isSelected = useDerivedBinding(selectedMessageFolder, (selectedMessageFolder) => selectedMessageFolder === folder, {
    id: 'isSelected',
    deps: [folder]
  });

  const IconComponent = iconComponentsByMessageFolder[folder];

  return BC(isSelected, (isSelected) => (
    <ListItemButton selected={isSelected} onClick={taggedOnClick} className="MessageFoldersListItem">
      <ListItemIcon>
        <IconComponent className="sm-icon" />
      </ListItemIcon>
      <ListItemText
        primary={getTitleForMessageFolder(folder, t)}
        slotProps={{
          primary: { variant: 'body2', className: 'medium', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
        }}
      />
      {shouldShowUnreadCountByMessageFolder[folder] ? <Chip className={isSelected ? 'selected' : undefined} label={unreadCount} /> : null}
    </ListItemButton>
  ));
};

export const MailCollectionListItemPlaceholder = () => (
  <ListItemButton disabled className="MessageFoldersListItem">
    <ListItemIcon>
      <IconPlaceholder />
    </ListItemIcon>
    <ListItemText primary={<TxtPlaceholder variant="body2" className="medium w-full" />} />
  </ListItemButton>
);

// Helpers

const iconComponentsByMessageFolder: Record<MessageFolder, SvgIconComponent> = {
  drafts: DraftIcon,
  inbox: InboxIcon,
  outbox: OutboxIcon,
  sent: SentIcon
};

const shouldShowUnreadCountByMessageFolder: Record<MessageFolder, boolean> = {
  drafts: false,
  inbox: true,
  outbox: false,
  sent: false
};

const getTitleForMessageFolder = (folder: MessageFolder, t: TFunction) => $messageFolder[folder](t);
