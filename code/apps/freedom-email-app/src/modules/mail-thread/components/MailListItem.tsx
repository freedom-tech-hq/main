import type { ListItemTextSlotsAndSlotProps, SxProps, Theme } from '@mui/material';
import { Avatar, Divider, ListItem, ListItemAvatar, ListItemText, Paper, Stack, Typography } from '@mui/material';
import { parseFrom } from 'email-addresses';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';

import { formatDate } from '../../../utils/formatDate.ts';
import { formatTime } from '../../../utils/formatTime.ts';
import { makeStringAvatarProps } from '../../../utils/makeStringAvatarProps.ts';
import type { MailDataSourceMailItem } from '../types/MailDataSourceItem.ts';
import { MailActionsMenu } from './MailActionsMenu.tsx';

const ns = 'ui';
const $toLabel = LOCALIZE('To:')({ ns });

export interface MailListItemProps<TagT> extends Omit<MailDataSourceMailItem, 'type'> {
  isFirst: boolean;
  tag: TagT;
}

export const MailListItem = <TagT,>({ isFirst, mail }: MailListItemProps<TagT>) => {
  const t = useT();
  
  const parsedFrom = parseFrom(mail.from) ?? [];
  const fromStrings = parsedFrom.map((parsed) => {
    switch (parsed.type) {
      case 'group':
        return parsed.name;
      case 'mailbox':
        return parsed.name ?? parsed.address;
    }
  });

  return (
    <Paper elevation={4} sx={{ position: 'relative', mx: 3, mt: isFirst ? 0 : 3, mb: 3 }}>
      <MailActionsMenu />
      <ListItem sx={{ flexDirection: 'column', alignItems: 'stretch', py: 1.5 }}>
        <Stack direction="row">
          <ListItemAvatar sx={avatarStyle}>
            <Stack direction="row" gap={1} alignItems="center">
              <Avatar {...makeStringAvatarProps(mail.from)} />
            </Stack>
          </ListItemAvatar>
          <Stack alignItems="stretch" sx={headerContentStyle}>
            <Stack direction="row" justifyContent="space-between" gap={1}>
              <Typography fontWeight="bold" sx={ellipsizeStyle}>
                {fromStrings.map((from, index) => `${index > 0 ? ', ' : ''}${from}`)}
              </Typography>
              <Stack direction="row" gap={1}>
                <Typography variant="body2" color="textSecondary" sx={noWrapStyle}>
                  {formatDate(mail.timeMSec)}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={noWrapStyle}>
                  {formatTime(mail.timeMSec)}
                </Typography>
              </Stack>
            </Stack>
            <Stack direction="row" gap={1}>
              <Typography variant="body2">{$toLabel(t)}</Typography>
              <Typography variant="body2" color="textSecondary" sx={ellipsizeStyle}>
                {mail.to}
              </Typography>
            </Stack>
          </Stack>
        </Stack>

        <ListItemText primary={mail.subject} slotProps={subjectSlotProps} sx={{ mt: 1 }} />

        <Divider sx={{ mx: -2, my: 1 }} />

        {mail.body.split(/\n+/).map((paragraph, index) => (
          <ListItemText key={index} secondary={paragraph} />
        ))}
      </ListItem>
    </Paper>
  );
};

// Helpers

const avatarStyle: SxProps<Theme> = { minWidth: '48px' };
const ellipsizeStyle: SxProps<Theme> = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const headerContentStyle: SxProps<Theme> = { flexGrow: 1, overflow: 'hidden' };
const noWrapStyle: SxProps<Theme> = { whiteSpace: 'nowrap' };
const subjectSlotProps: ListItemTextSlotsAndSlotProps['slotProps'] = { primary: { fontWeight: 'bold' } };
