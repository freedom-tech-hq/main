import { ListItemAvatar, ListItemButton, ListItemText, Stack } from '@mui/material';
import { parseFrom } from 'email-addresses';
import { BC, useBinding, useCallbackRef, useDerivedBinding } from 'react-bindings';
import { useDerivedWaitable, WC } from 'react-waitables';

import { Txt } from '../../../../components/reusable/aliases/Txt.tsx';
import { ControlledCheckbox } from '../../../../components/reusable/form/ControlledCheckbox.tsx';
import { StringAvatar } from '../../../../components/reusable/StringAvatar.tsx';
import { UnreadIndicator } from '../../../../components/reusable/UnreadIndicator.tsx';
import { useSelectedMailThreadId } from '../../../../contexts/selected-mail-thread.tsx';
import { useTaskWaitable } from '../../../../hooks/useTaskWaitable.ts';
import { formatTimeIfSameDateOrFormatDate } from '../../../../utils/formatTimeIfSameDateOrFormatDate.ts';
import type { MailThreadsListThreadDataSourceItem } from './MailThreadsListThreadDataSourceItem.ts';

export interface MailThreadListItemProps<TagT> extends Omit<MailThreadsListThreadDataSourceItem, 'type'> {
  tag: TagT;
  onClick: (tag: TagT) => void;
}

export const MailThreadListItem = <TagT,>({ id, timeMSec, tag, onClick }: MailThreadListItemProps<TagT>) => {
  const selectedThreadId = useSelectedMailThreadId();

  const thread = useTaskWaitable((tasks) => tasks.getMailThread(id), { id: 'thread', deps: [id] });

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
      parsedFrom.map((parsed, index) => {
        switch (parsed.type) {
          case 'group':
            return (
              <Txt variant="inherit" component="span" key={index}>
                {parsed.name}
                {index < parsedFrom.length - 1 ? <span>, </span> : null}
              </Txt>
            );
          case 'mailbox':
            return (
              <Txt variant="inherit" component="span" key={index}>
                {parsed.name ?? parsed.address}
                {index < parsedFrom.length - 1 ? <span>, </span> : null}
              </Txt>
            );
        }
      }),
    { id: 'fromTags', detectValueChanges: false }
  );

  return (
    <>
      {BC(isSelected, (isSelected) => (
        <ListItemButton selected={isSelected} onClick={taggedOnClick} className="mail-thread-list-item">
          {WC({ thread, fromTags }, ({ thread, fromTags }) => (
            <>
              <ListItemAvatar>
                <Stack direction="row" alignItems="center" gap={1}>
                  <ControlledCheckbox checked={isChecked} />
                  <StringAvatar className="md-avatar" value={thread.from} />
                </Stack>
              </ListItemAvatar>
              <Stack alignItems="stretch">
                <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                  <Stack direction="row" alignItems="center" gap={1} sx={{ flex: 1, overflow: 'hidden' }}>
                    {thread.numUnread > 0 ? <UnreadIndicator /> : null}
                    <Txt variant="body1" className="medium" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {fromTags}
                    </Txt>
                  </Stack>
                  <Txt variant="caption" color="disabled" sx={{ whiteSpace: 'nowrap' }}>
                    {formatTimeIfSameDateOrFormatDate(timeMSec)}
                  </Txt>
                </Stack>
                <ListItemText>
                  <Txt
                    variant="body2"
                    sx={{
                      overflow: 'hidden',
                      maxHeight: '72px'
                    }}
                  >
                    {thread.subject}
                    {' – '}
                    <Txt component="span" color="textDisabled">
                      {thread.body}
                    </Txt>
                  </Txt>
                </ListItemText>
              </Stack>
            </>
          ))}
        </ListItemButton>
      ))}
    </>
  );
};
