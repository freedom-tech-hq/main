import { Stack } from '@mui/material';
import { parseFrom, parseOneAddress } from 'email-addresses';
import { LOCALIZE } from 'freedom-localization';
import { IF } from 'freedom-logical-web-components';
import { useT } from 'freedom-react-localization';
import { once } from 'lodash-es';
import { generatePseudoWord } from 'pseudo-words';
import React from 'react';
import { useBinding } from 'react-bindings';

import { Txt } from '../../../../components/reusable/aliases/Txt.ts';
import { AvatarPlaceholder } from '../../../../components/reusable/AvatarPlaceholder.tsx';
import { StringAvatar } from '../../../../components/reusable/StringAvatar.tsx';
import { TxtPlaceholder } from '../../../../components/reusable/TxtPlaceholder.tsx';
import { formatDate } from '../../../../utils/formatDate.ts';
import { formatTime } from '../../../../utils/formatTime.ts';
import { AttachmentButton, AttachmentButtonPlaceholder } from './AttachmentButton.tsx';
import type { MailListDataSourceMailItem } from './MailListDataSourceItem.ts';
import {
  MailListItemFormattedEmailAddresses,
  MailListItemFormattedEmailAddressesPlaceholder
} from './MailListItemFormattedEmailAddresses.tsx';
import { MailListItemTimeLabel } from './MailListItemTimeLabel.tsx';

const ns = 'ui';
const $attachments = LOCALIZE('Attachments')({ ns });
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
    <Stack gap={3} sx={{ mx: 1, mb: 8 }} className="default-bg">
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

        <Txt variant="body1" className="medium whitespace-pre-line">
          {mail.body}
        </Txt>

        {IF(mail.attachments.length > 0, () => (
          <Stack sx={{ mt: 1 }} gap={2}>
            <Txt variant="h3" color="textDisabled" className="semibold">
              {$attachments(t)}
            </Txt>
            <Stack direction="row" gap={1.5}>
              {mail.attachments.map((attachment) => (
                <AttachmentButton key={attachment.id} attachment={attachment} />
              ))}
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
};

export const MailListItemPlaceholder = () => {
  const t = useT();

  return (
    <Stack gap={3} sx={{ mx: 1, mb: 8 }} className="default-bg">
      <Stack direction="row" gap={1} className="flex-auto overflow-hidden">
        <Stack direction="row" gap={1.5} className="flex-auto overflow-hidden">
          <AvatarPlaceholder />
          <Stack className="flex-auto overflow-hidden">
            <Stack direction="row" justifyContent="space-between" className="flex-auto overflow-hidden">
              <MailListItemFormattedEmailAddressesPlaceholder mode="from" />
              <TxtPlaceholder variant="body2">{`${formatDate(Date.now())} ${formatTime(Date.now())}`}</TxtPlaceholder>
            </Stack>

            <Stack direction="row" alignItems="baseline" gap={1} className="flex-auto overflow-hidden">
              <TxtPlaceholder variant="body2">{$to(t)}</TxtPlaceholder>
              <Stack className="flex-auto overflow-hidden">
                <MailListItemFormattedEmailAddressesPlaceholder mode="to" />
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </Stack>

      <Stack gap={3} sx={{ pl: 6 }}>
        <TxtPlaceholder variant="h1" className="semibold w-1/3" />

        <TxtPlaceholder variant="body1" className="medium">
          {generatePlaceholderParagraph()}
        </TxtPlaceholder>

        <Stack sx={{ mt: 1 }} gap={2}>
          <TxtPlaceholder variant="h3" color="textDisabled" className="semibold">
            {$attachments(t)}
          </TxtPlaceholder>
          <Stack direction="row" gap={1.5}>
            {Array(3)
              .fill(0)
              .map((_, index) => (
                <AttachmentButtonPlaceholder key={index} />
              ))}
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};

// Helpers

const generatePlaceholderParagraph = once(() =>
  Array(Math.floor(Math.random() * 100 + 50))
    .fill(0)
    .map(() => generatePseudoWord())
    .join(' ')
);
