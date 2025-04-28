import type { ListItemTextSlotsAndSlotProps, SxProps, Theme } from '@mui/material';
import { Avatar, Divider, ListItem, ListItemAvatar, ListItemText, Paper, Stack, Typography } from '@mui/material';
import { parseFrom } from 'email-addresses';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import type { CSSProperties } from 'react';
import { Fragment } from 'react/jsx-runtime';

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
  const fromTags = parsedFrom.map((parsed, index) => {
    switch (parsed.type) {
      case 'group':
        return (
          <Fragment key={index}>
            <Typography fontWeight="bold" title={parsed.name} sx={nameStyle}>
              {parsed.name}
            </Typography>{' '}
            <Typography
              component="span"
              color="textSecondary"
              sx={addressStyle}
              title={parsed.addresses.map((from) => from.address).join(', ')}
            >
              &lt;
              {parsed.addresses.map((member, index) => (
                <Fragment key={index}>
                  <span style={wrapTextAnywhereReactStyle}>{member.local}</span>@
                  <span style={wrapTextAnywhereReactStyle}>{member.domain}</span>
                  {index < parsed.addresses.length - 1 ? <span style={commaReactStyle}>,</span> : null}
                </Fragment>
              ))}
              &gt;
            </Typography>
          </Fragment>
        );

      case 'mailbox':
        if (parsed.name === null) {
          return (
            <Typography key={index} component="span" fontWeight="bold" title={parsed.address}>
              <span style={wrapTextAnywhereReactStyle}>{parsed.local}</span>@<span style={wrapTextAnywhereReactStyle}>{parsed.domain}</span>
              {index < parsedFrom.length - 1 ? <span style={commaReactStyle}>,</span> : null}
            </Typography>
          );
        } else {
          return (
            <Fragment key={index}>
              <Typography fontWeight="bold" title={parsed.name} sx={nameStyle}>
                {parsed.name}
              </Typography>{' '}
              <Typography component="span" color="textSecondary" sx={addressStyle} title={parsed.address}>
                &lt;
                <span style={wrapTextAnywhereReactStyle}>{parsed.local}</span>@
                <span style={wrapTextAnywhereReactStyle}>{parsed.domain}</span>
                &gt;
                {index < parsedFrom.length - 1 ? <span style={commaReactStyle}>,</span> : null}
              </Typography>
            </Fragment>
          );
        }
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
            <div>
              <Stack direction="row" gap={1} sx={{ float: 'right', ml: 1 }}>
                <Typography variant="body2" color="textSecondary" sx={noWrapStyle}>
                  {formatDate(mail.timeMSec)}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={noWrapStyle}>
                  {formatTime(mail.timeMSec)}
                </Typography>
              </Stack>
              <div>{fromTags}</div>
            </div>
            <Stack direction="row" gap={1}>
              <Typography variant="body2">{$toLabel(t)}</Typography>
              <Typography variant="body2" color="textSecondary" sx={wrapTextAnywhereStyle}>
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
const nameStyle: SxProps<Theme> = {
  display: 'inline-block',
  maxWidth: '100%',
  lineHeight: 1,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};
const addressStyle: SxProps<Theme> = {
  display: 'inline-block',
  maxWidth: '100%',
  lineHeight: 1,
  overflow: 'hidden'
};
const commaReactStyle: CSSProperties = { marginRight: '0.25em' };
const wrapTextAnywhereStyle: SxProps<Theme> = { overflowWrap: 'anywhere' };
const wrapTextAnywhereReactStyle: CSSProperties = { overflowWrap: 'anywhere' };
const headerContentStyle: SxProps<Theme> = { flexGrow: 1, overflow: 'hidden' };
const noWrapStyle: SxProps<Theme> = { whiteSpace: 'nowrap' };
const subjectSlotProps: ListItemTextSlotsAndSlotProps['slotProps'] = { primary: { fontWeight: 'bold' } };
