import type { ListItemTextSlotsAndSlotProps, SxProps, Theme } from '@mui/material';
import { Avatar, Divider, ListItem, ListItemAvatar, ListItemText, Paper, Stack, Typography } from '@mui/material';

import { formatDateTime } from '../../../utils/formatDateTime.ts';
import { makeStringAvatarProps } from '../../../utils/makeStringAvatarProps.ts';
import type { MailDataSourceItem } from '../types/MailDataSourceItem.ts';

export interface MailItemProps<TagT> extends Omit<MailDataSourceItem, 'type'> {
  tag: TagT;
}

export const MailListItem = <TagT,>({ mail }: MailItemProps<TagT>) => {
  return (
    <Paper elevation={4} sx={{ mx: 3, my: 1 }}>
      <ListItem sx={{ flexDirection: 'column', alignItems: 'stretch', py: 1.5 }}>
        <Stack direction="row">
          <ListItemAvatar sx={avatarStyle}>
            <Stack direction="row" gap={1} alignItems="center">
              <Avatar {...makeStringAvatarProps(mail.from)} />
            </Stack>
          </ListItemAvatar>
          <Stack alignItems="stretch" sx={headerContentStyle}>
            <Stack direction="row" justifyContent="space-between" gap={1}>
              <Typography fontWeight="bold">{mail.from}</Typography>
              <Typography variant="body2" color="textSecondary">
                {formatDateTime(mail.timeMSec)}
              </Typography>
            </Stack>
            <Stack direction="row" gap={1}>
              <Typography variant="body2">To:</Typography>
              <Typography variant="body2" color="textSecondary">
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
const headerContentStyle: SxProps<Theme> = { flexGrow: 1 };
const subjectSlotProps: ListItemTextSlotsAndSlotProps['slotProps'] = { primary: { fontWeight: 'bold' } };
