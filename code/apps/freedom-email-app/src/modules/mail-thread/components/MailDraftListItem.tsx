import type { SxProps, Theme } from '@mui/material';
import { Avatar, Divider, ListItem, ListItemAvatar, ListItemText, Paper, Stack, Typography } from '@mui/material';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import { useBinding } from 'react-bindings';

import { ControlledTextField } from '../../../components/form/ControlledTextField.tsx';
import { makeStringAvatarProps } from '../../../utils/makeStringAvatarProps.ts';
import type { MailDataSourceDraftItem } from '../types/MailDataSourceItem.ts';
import { MailActionsMenu } from './MailActionsMenu.tsx';

const ns = 'ui';
const $toLabel = LOCALIZE('To:')({ ns });

export interface MailDraftListItemProps<TagT> extends Omit<MailDataSourceDraftItem, 'type'> {
  isFirst: boolean;
  tag: TagT;
}

export const MailDraftListItem = <TagT,>({ isFirst, mail }: MailDraftListItemProps<TagT>) => {
  const t = useT();

  // TODO: support array
  const to = useBinding(() => mail.to[0] ?? '', { id: 'to', detectChanges: true });
  const subject = useBinding(() => mail.subject, { id: 'subject', detectChanges: true });

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
            <Typography fontWeight="bold" sx={ellipsizeStyle}>
              {mail.from}
            </Typography>
            <Stack direction="row" gap={1}>
              <Typography variant="body2">{$toLabel(t)}</Typography>
              <ControlledTextField size="small" value={to} />
            </Stack>
          </Stack>
        </Stack>

        <ControlledTextField size="small" value={subject} sx={{ mt: 1 }} />

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
