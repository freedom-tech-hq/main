import type { ListItemTextSlotsAndSlotProps, SxProps, Theme } from '@mui/material';
import { Avatar, ListItemAvatar, ListItemButton, ListItemText, Stack, Typography, useTheme } from '@mui/material';
import { parseFrom } from 'email-addresses';
import type { CSSProperties } from 'react';
import { useMemo } from 'react';
import { BC, useCallbackRef, useDerivedBinding } from 'react-bindings';
import { useDerivedWaitable, WC } from 'react-waitables';

import { useSelectedMailThreadId } from '../../../contexts/selected-mail-thread.tsx';
import { useTaskWaitable } from '../../../hooks/useTaskWaitable.ts';
import { formatTimeIfSameDateOrFormatDate } from '../../../utils/formatTimeIfSameDateOrFormatDate.ts';
import { makeStringAvatarProps } from '../../../utils/makeStringAvatarProps.ts';
import type { MailThreadDataSourceItem } from '../types/MailThreadDataSourceItem.ts';

export interface MailThreadListItemProps<TagT> extends Omit<MailThreadDataSourceItem, 'type'> {
  tag: TagT;
  onClick: (tag: TagT) => void;
}

export const MailThreadListItem = <TagT,>({ id, timeMSec, tag, onClick }: MailThreadListItemProps<TagT>) => {
  const selectedThreadId = useSelectedMailThreadId();
  const theme = useTheme();

  const thread = useTaskWaitable((tasks) => tasks.getMailThread(id), { id: 'thread', deps: [id] });

  const taggedOnClick = useCallbackRef(() => onClick(tag));

  const isSelected = useDerivedBinding(selectedThreadId, (selectedThreadId) => selectedThreadId === id, {
    id: 'isSelected',
    deps: [id]
  });

  const unreadIndicatorStyle = useMemo((): Record<`${boolean}`, CSSProperties> => {
    const baseStyle: CSSProperties = {
      position: 'absolute',
      marginLeft: theme.spacing(-1.5),
      width: theme.spacing(1),
      height: theme.spacing(1),
      borderRadius: `calc(${theme.spacing(1)} / 2)`
    };
    return {
      true: {
        ...baseStyle,
        backgroundColor: theme.palette.primary.light
      },
      false: baseStyle
    };
  }, [theme]);

  const parsedFrom = useDerivedWaitable(thread, (thread) => parseFrom(thread.from) ?? [], { id: 'parsedFrom' });
  const fromTags = useDerivedWaitable(
    parsedFrom,
    (parsedFrom) =>
      parsedFrom.map((parsed, index) => {
        switch (parsed.type) {
          case 'group':
            return (
              <Typography key={index} fontWeight="bold" sx={emailStyle}>
                {parsed.name}
                {index < parsedFrom.length - 1 ? <span style={commaReactStyle}>,</span> : null}
              </Typography>
            );
          case 'mailbox':
            return (
              <Typography key={index} fontWeight="bold" sx={emailStyle}>
                {parsed.name ?? parsed.address}
                {index < parsedFrom.length - 1 ? <span style={commaReactStyle}>,</span> : null}
              </Typography>
            );
        }
      }),
    { id: 'fromTags', detectValueChanges: false }
  );

  return (
    <>
      {BC(isSelected, (isSelected) => (
        <ListItemButton
          selected={isSelected}
          onClick={taggedOnClick}
          sx={{ borderBottom: `1px solid ${theme.palette.divider}`, alignItems: 'flex-start' }}
        >
          <ListItemAvatar sx={avatarStyle}>
            <Stack direction="row" gap={1} alignItems="center">
              {WC(
                thread,
                (thread) => (
                  <>
                    <div style={unreadIndicatorStyle[`${thread.numUnread > 0}`]} />
                    <Avatar {...makeStringAvatarProps(thread.from)} />
                  </>
                ),
                () => (
                  <>
                    <div style={unreadIndicatorStyle.false} />
                    <Avatar sx={{ bgcolor: theme.palette.divider }} />
                  </>
                )
              )}
            </Stack>
          </ListItemAvatar>
          <Stack alignItems="stretch" sx={{ ...overflowHiddenStyle, flexGrow: 1 }}>
            <div>
              <Typography variant="body2" color="textSecondary" sx={{ ...noWrapStyle, float: 'right', ml: 1 }}>
                {formatTimeIfSameDateOrFormatDate(timeMSec)}
              </Typography>
              <div>{WC(fromTags, (fromTags) => fromTags)}</div>
            </div>
            {WC(thread, (thread) => (
              <>
                <ListItemText primary={thread.subject} slotProps={subjectSlotProps} sx={noVerticalMarginStyle} />
                <ListItemText
                  secondary={thread.body}
                  sx={{
                    overflow: 'hidden',
                    height: `calc(${theme.typography.body2.fontSize} * ${theme.typography.body2.lineHeight} * 2)`
                  }}
                />
              </>
            ))}
          </Stack>
        </ListItemButton>
      ))}
    </>
  );
};

// Helpers

const avatarStyle: SxProps<Theme> = { minWidth: '48px' };
const emailStyle: SxProps<Theme> = {
  display: 'inline-block',
  maxWidth: '100%',
  lineHeight: 1,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};
const commaReactStyle: CSSProperties = { marginRight: '0.25em' };
const overflowHiddenStyle: SxProps<Theme> = { overflow: 'hidden' };
const noWrapStyle: SxProps<Theme> = { whiteSpace: 'nowrap' };
const noVerticalMarginStyle: SxProps<Theme> = { my: 0 };
const subjectSlotProps: ListItemTextSlotsAndSlotProps['slotProps'] = {
  primary: { fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
};
