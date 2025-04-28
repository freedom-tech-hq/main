import type { ListItemTextSlotsAndSlotProps, SxProps, Theme } from '@mui/material';
import { Avatar, ListItemAvatar, ListItemButton, ListItemText, Stack, Typography, useTheme } from '@mui/material';
import { parseFrom } from 'email-addresses';
import type { CSSProperties } from 'react';
import { useMemo } from 'react';
import { BC, useCallbackRef, useDerivedBinding } from 'react-bindings';

import { useSelectedMailThreadId } from '../../../contexts/selected-mail-thread.tsx';
import { formatTimeIfSameDateOrFormatDate } from '../../../utils/formatTimeIfSameDateOrFormatDate.ts';
import { makeStringAvatarProps } from '../../../utils/makeStringAvatarProps.ts';
import type { MailThreadDataSourceItem } from '../types/MailThreadDataSourceItem.ts';

export interface MailThreadListItemProps<TagT> extends Omit<MailThreadDataSourceItem, 'type'> {
  tag: TagT;
  onClick: (tag: TagT) => void;
}

export const MailThreadListItem = <TagT,>({ thread, tag, onClick }: MailThreadListItemProps<TagT>) => {
  const selectedThreadId = useSelectedMailThreadId();
  const theme = useTheme();

  const taggedOnClick = useCallbackRef(() => onClick(tag));

  const isSelected = useDerivedBinding(selectedThreadId, (selectedThreadId) => selectedThreadId === thread.id, {
    id: 'isSelected',
    deps: [thread.id]
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

  const parsedFrom = parseFrom(thread.from) ?? [];
  const fromTags = parsedFrom.map((parsed, index) => {
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
  });

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
              <div style={unreadIndicatorStyle[`${thread.numUnread > 0}`]} />
              <Avatar {...makeStringAvatarProps(thread.from)} />
            </Stack>
          </ListItemAvatar>
          <Stack alignItems="stretch" sx={{ ...overflowHiddenStyle, flexGrow: 1 }}>
            <div>
              <Typography variant="body2" color="textSecondary" sx={{ ...noWrapStyle, float: 'right', ml: 1 }}>
                {formatTimeIfSameDateOrFormatDate(thread.timeMSec)}
              </Typography>
              <div>{fromTags}</div>
            </div>
            <ListItemText primary={thread.subject} slotProps={subjectSlotProps} sx={noVerticalMarginStyle} />
            <ListItemText
              secondary={thread.body}
              sx={{
                overflow: 'hidden',
                height: `calc(${theme.typography.body2.fontSize} * ${theme.typography.body2.lineHeight} * 2)`
              }}
            />
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
