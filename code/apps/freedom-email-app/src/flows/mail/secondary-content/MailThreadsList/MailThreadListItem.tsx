import { ListItemAvatar, ListItemButton, Stack } from '@mui/material';
import type { MailThreadsDataSetId } from 'freedom-email-tasks-web-worker';
import React from 'react';
import { useBinding, useCallbackRef, useDerivedBinding } from 'react-bindings';
import { useDerivedWaitable, WC } from 'react-waitables';

import { Txt } from '../../../../components/reusable/aliases/Txt.ts';
import { AvatarPlaceholder } from '../../../../components/reusable/AvatarPlaceholder.tsx';
import { ControlledCheckbox, ControlledCheckboxPlaceholder } from '../../../../components/reusable/form/ControlledCheckbox.tsx';
import { StringAvatar } from '../../../../components/reusable/StringAvatar.tsx';
import { TxtPlaceholder } from '../../../../components/reusable/TxtPlaceholder.tsx';
import { useSelectedMailThreadId } from '../../../../contexts/selected-mail-thread-id.tsx';
import { useTaskWaitable } from '../../../../hooks/useTaskWaitable.ts';
import { formatTimeIfSameDateOrFormatDate } from '../../../../utils/formatTimeIfSameDateOrFormatDate.ts';
import { getStringAvatarValueFromMailAddressList } from '../../../../utils/getStringAvatarValueFromMailAddressList.ts';
import { makeTagsFromMailAddressList } from '../../../../utils/makeTagsFromMailAddressList.ts';
import { AttachmentCountChip, AttachmentCountChipPlaceholder } from './AttachmentCountChip.tsx';
import type { MailThreadsListThreadDataSourceItem } from './MailThreadsListThreadDataSourceItem.ts';

export interface MailThreadListItemProps<TagT> extends Omit<MailThreadsListThreadDataSourceItem, 'type'> {
  dataSetId: MailThreadsDataSetId;
  tag: TagT;
  onClick: (tag: TagT) => void;
}

export const MailThreadListItem = <TagT,>({ id, timeMSec, dataSetId, tag, onClick }: MailThreadListItemProps<TagT>) => {
  const selectedThreadId = useSelectedMailThreadId();

  const thread = useTaskWaitable((tasks) => tasks.getMailThread(dataSetId, id), {
    id: 'thread',
    deps: [id]
  });

  const taggedOnClick = useCallbackRef(() => onClick(tag));

  const isSelected = useDerivedBinding(selectedThreadId, (selectedThreadId) => selectedThreadId === id, {
    id: 'isSelected',
    deps: [id]
  });
  const isChecked = useBinding(() => false, { id: 'isChecked', detectChanges: true });

  const fromTags = useDerivedWaitable(
    thread,
    (thread) =>
      makeTagsFromMailAddressList(thread.lastMessage.from, {
        group: (group, index) => (
          <Txt variant="inherit" component="span" key={index}>
            {group.groupName}
            {index < thread.lastMessage.from.length - 1 ? <span>, </span> : null}
          </Txt>
        ),
        single: (single, index) => (
          <Txt variant="inherit" component="span" key={index}>
            {(single.name?.length ?? 0) > 0 ? single.name : single.address}
            {index < thread.lastMessage.from.length - 1 ? <span>, </span> : null}
          </Txt>
        )
      }),
    { id: 'fromTags', detectValueChanges: false }
  );

  return WC(
    { isSelected, thread, fromTags },
    ({ isSelected, thread, fromTags }) => (
      <ListItemButton selected={isSelected} onClick={taggedOnClick} className="mail-thread-list-item">
        <ListItemAvatar>
          <Stack direction="row" alignItems="center" gap={1}>
            <ControlledCheckbox checked={isChecked} />
            <StringAvatar className="md-avatar" value={getStringAvatarValueFromMailAddressList(thread.lastMessage.from)} />
          </Stack>
        </ListItemAvatar>
        <Stack alignItems="stretch" className="flex-auto overflow-hidden">
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} className="overflow-hidden">
            <Stack direction="row" alignItems="center" gap={1} className="flex-auto overflow-hidden">
              {/* TODO: support unread count */}
              {/* {thread.numUnread > 0 ? <UnreadIndicator /> : null} */}
              <Txt variant="body1" className="medium flex-auto whitespace-nowrap overflow-hidden text-ellipsis">
                {fromTags}
              </Txt>
            </Stack>
            <Txt variant="caption" color="disabled" className="whitespace-no-wrap">
              {formatTimeIfSameDateOrFormatDate(timeMSec)}
            </Txt>
          </Stack>
          <Stack>
            <Txt variant="body2" className="overflow-hidden" sx={{ height: '60px' }}>
              {thread.lastMessage.subject}
              {' – '}
              <Txt variant="inherit" component="span" color="textDisabled">
                {thread.lastMessage.snippet}
              </Txt>
            </Txt>
          </Stack>
          {/* TODO: support attachments */}
          <Stack direction="row" alignItems="center" sx={{ mt: 1, visibility: 'hidden' }}>
            <AttachmentCountChip
              count={0}
              // count={thread.numAttachments}
            />
          </Stack>
        </Stack>
      </ListItemButton>
    ),
    () => <MailThreadListItemPlaceholder />
  );
};

export const MailThreadListItemPlaceholder = () => (
  <ListItemButton disabled className="mail-thread-list-item">
    <ListItemAvatar>
      <Stack direction="row" alignItems="center" gap={1}>
        <ControlledCheckboxPlaceholder />
        <AvatarPlaceholder className="md-avatar" />
      </Stack>
    </ListItemAvatar>
    <Stack alignItems="stretch" className="flex-auto overflow-hidden">
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} className="overflow-hidden">
        <Stack direction="row" alignItems="center" gap={1} className="flex-auto overflow-hidden">
          <TxtPlaceholder variant="body1" className="medium">
            {`email@freedommail.me`}
          </TxtPlaceholder>
        </Stack>
        <TxtPlaceholder variant="caption" color="disabled" className="whitespace-no-wrap">
          {formatTimeIfSameDateOrFormatDate(Date.now())}
        </TxtPlaceholder>
      </Stack>
      <Stack>
        <TxtPlaceholder variant="body2" className="w-full" />
        <TxtPlaceholder variant="body2" className="w-full" />
        <TxtPlaceholder variant="body2" className="w-full" />
      </Stack>
      <Stack direction="row" alignItems="center" sx={{ mt: 1 }}>
        <AttachmentCountChipPlaceholder />
      </Stack>
    </Stack>
  </ListItemButton>
);
