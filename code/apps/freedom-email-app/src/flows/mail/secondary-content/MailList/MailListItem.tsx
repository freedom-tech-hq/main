import { Stack } from '@mui/material';
import { parseFrom, parseOneAddress } from 'email-addresses';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import React from 'react';
import { useBinding } from 'react-bindings';

import { Txt } from '../../../../components/reusable/aliases/Txt.ts';
import { StringAvatar } from '../../../../components/reusable/StringAvatar.tsx';
import type { MailListDataSourceMailItem } from './MailListDataSourceItem.ts';
import { MailListItemFormattedEmailAddresses } from './MailListItemFormattedEmailAddresses.tsx';
import { MailListItemTimeLabel } from './MailListItemTimeLabel.tsx';

const ns = 'ui';
const $attachments = LOCALIZE('Attachments')({ ns });
const $forward = LOCALIZE('Forward')({ ns });
const $reply = LOCALIZE('Reply')({ ns });
const $to = LOCALIZE('to')({ ns });

export type MailListItemProps = Omit<MailListDataSourceMailItem, 'type'>;

export const MailListItem = ({ mail }: MailListItemProps) => {
  const t = useT();

  const showFromGroupMembers = useBinding(() => false, { id: 'showFromGroupMembers', detectChanges: true });

  const showToGroupMembers = useBinding(() => false, { id: 'showToGroupMembers', detectChanges: true });

  const parsedFrom = parseFrom(mail.from) ?? [];
  const firstFrom = parsedFrom[0];
  const firstFromAddress =
    firstFrom?.type === 'group'
      ? `${firstFrom.name}: ${firstFrom.addresses[0]?.name ?? ''} <${firstFrom.addresses[0]?.address ?? ''}>`
      : `${firstFrom?.name ?? ''} <${firstFrom?.address ?? ''}>`;

  const parsedTo = mail.to.map(parseOneAddress);

  return (
    <Stack gap={3} sx={{ mx: 1, mb: 8 }}>
      <Stack direction="row" gap={1} className="flex-auto overflow-hidden">
        <Stack direction="row" gap={1.5} className="flex-auto overflow-hidden">
          <StringAvatar value={firstFromAddress} />
          <Stack className="flex-auto overflow-hidden">
            <Stack direction="row" justifyContent="space-between" className="flex-auto overflow-hidden">
              <MailListItemFormattedEmailAddresses addresses={parsedFrom} showGroupMembers={showFromGroupMembers} mode="from" />
              <MailListItemTimeLabel timeMSec={mail.timeMSec} />
            </Stack>

            <Stack direction="row" alignItems="baseline" gap={1} className="flex-auto overflow-hidden">
              <Txt variant="body2" color="textDisabled">
                {$to(t)}
              </Txt>
              <Stack className="flex-auto overflow-hidden">
                <MailListItemFormattedEmailAddresses
                  addresses={parsedTo.filter((address) => address !== null)}
                  showGroupMembers={showToGroupMembers}
                  mode="to"
                />
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </Stack>

      <Stack gap={3} sx={{ pl: 6 }}>
        <Txt variant="h1" className="semibold">
          {mail.subject}
        </Txt>

        <Txt variant="body1" className="medium">
          {mail.body}
        </Txt>
      </Stack>

      {/* <ListItem sx={{ flexDirection: 'column', alignItems: 'stretch', py: 1.5 }}>
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
              <Typography variant="body2">{$to(t)}</Typography>
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
        ))} */}
      {/* </ListItem> */}
    </Stack>
  );
};

/** Returns a BindingsConsumer JSX Element.  This is useful as a shorthand especially when passing BindingsConsumers as props of other
 * components */
// const BC = <DependenciesT extends BindingDependencies>(
//   bindings: DependenciesT,
//   children: BindingsConsumerRenderCallback<DependenciesT>
// ) => <BindingsConsumer bindings={bindings}>{children}</BindingsConsumer>;
