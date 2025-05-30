import { ListItemAvatar, ListItemButton, Stack } from '@mui/material';
import { parseFrom } from 'email-addresses';
import React from 'react';
import { BC, useBinding, useCallbackRef, useDerivedBinding } from 'react-bindings';
import { useDerivedWaitable, WC } from 'react-waitables';

import { Txt } from '../../../../components/reusable/aliases/Txt.ts';
import { AvatarPlaceholder } from '../../../../components/reusable/AvatarPlaceholder.tsx';
import { ControlledCheckbox } from '../../../../components/reusable/form/ControlledCheckbox.tsx';
import { StringAvatar } from '../../../../components/reusable/StringAvatar.tsx';
import { TxtPlaceholder } from '../../../../components/reusable/TxtPlaceholder.tsx';
import { UnreadIndicator } from '../../../../components/reusable/UnreadIndicator.tsx';
import { useSelectedMailThreadId } from '../../../../contexts/selected-mail-thread.tsx';
import { useTaskWaitable } from '../../../../hooks/useTaskWaitable.ts';
import { formatTimeIfSameDateOrFormatDate } from '../../../../utils/formatTimeIfSameDateOrFormatDate.ts';
import { makeTagsForParsedEmailAddresses } from '../../../../utils/makeTagsForParsedEmailAddresses.ts';
import { AttachmentCountChip, AttachmentCountChipPlaceholder } from './AttachmentCountChip.tsx';
import type { MailThreadsListThreadDataSourceItem } from './MailThreadsListThreadDataSourceItem.ts';

export interface MailThreadListItemProps<TagT> extends Omit<MailThreadsListThreadDataSourceItem, 'type'> {
  tag: TagT;
  onClick: (tag: TagT) => void;
}

export const MailThreadListItem = <TagT,>({ id, timeMSec, tag, onClick }: MailThreadListItemProps<TagT>) => {
  const selectedThreadId = useSelectedMailThreadId();

  const thread = useTaskWaitable((tasks) => tasks.getMailThread(id), {
    id: 'thread',
    deps: [id]
  });

  const taggedOnClick = useCallbackRef(() => onClick(tag));

  const isSelected = useDerivedBinding(selectedThreadId, (selectedThreadId) => selectedThreadId === id, {
    id: 'isSelected',
    deps: [id]
  });
  const isChecked = useBinding(() => false, { id: 'isChecked', detectChanges: true });

  const parsedFrom = useDerivedWaitable(thread, (thread) => parseFrom(thread.from) ?? [], { id: 'parsedFrom' });
  const fromTags = useDerivedWaitable(
    parsedFrom,
    (parsedFrom) =>
      makeTagsForParsedEmailAddresses(parsedFrom, {
        group: (parsed, index) => (
          <Txt variant="inherit" component="span" key={index}>
            {parsed.name}
            {index < parsedFrom.length - 1 ? <span>, </span> : null}
          </Txt>
        ),
        single: (parsed, index) => (
          <Txt variant="inherit" component="span" key={index}>
            {parsed.name ?? parsed.address}
            {index < parsedFrom.length - 1 ? <span>, </span> : null}
          </Txt>
        )
      }),
    { id: 'fromTags', detectValueChanges: false }
  );

  return BC(isSelected, (isSelected) => (
    <ListItemButton selected={isSelected} onClick={taggedOnClick} className="mail-thread-list-item">
      {WC(
        { thread, fromTags },
        ({ thread, fromTags }) => (
          <>
            <ListItemAvatar>
              <Stack direction="row" alignItems="center" gap={1}>
                <ControlledCheckbox checked={isChecked} />
                <StringAvatar className="md-avatar" value={thread.from} />
              </Stack>
            </ListItemAvatar>
            <Stack alignItems="stretch" className="flex-auto overflow-hidden">
              <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} className="overflow-hidden">
                <Stack direction="row" alignItems="center" gap={1} className="flex-auto overflow-hidden">
                  {thread.numUnread > 0 ? <UnreadIndicator /> : null}
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
                  {thread.subject}
                  {' – '}
                  <Txt variant="inherit" component="span" color="textDisabled">
                    {thread.body}
                  </Txt>
                </Txt>
              </Stack>
              <Stack direction="row" alignItems="center" sx={{ mt: 1, visibility: thread.numAttachments > 0 ? undefined : 'hidden' }}>
                <AttachmentCountChip count={thread.numAttachments} />
              </Stack>
            </Stack>
          </>
        ),
        () => (
          <>
            <ListItemAvatar>
              <Stack direction="row" alignItems="center" gap={1}>
                <ControlledCheckbox checked={isChecked} />
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
          </>
        )
      )}
    </ListItemButton>
  ));
};
