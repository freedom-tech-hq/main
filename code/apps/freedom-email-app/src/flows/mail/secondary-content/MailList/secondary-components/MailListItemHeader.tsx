import { Button, Stack } from '@mui/material';
import type { DecryptedViewMessage } from 'freedom-email-api';
import { LOCALIZE } from 'freedom-localization';
import { IF } from 'freedom-logical-web-components';
import { useBindingPersistence } from 'freedom-react-binding-persistence';
import { useT } from 'freedom-react-localization';
import React from 'react';
import { useBinding, useCallbackRef } from 'react-bindings';

import { Txt } from '../../../../../components/reusable/aliases/Txt.ts';
import { AvatarPlaceholder } from '../../../../../components/reusable/AvatarPlaceholder.tsx';
import { StringAvatar } from '../../../../../components/reusable/StringAvatar.tsx';
import { TxtPlaceholder } from '../../../../../components/reusable/TxtPlaceholder.tsx';
import { useMessagePresenter } from '../../../../../contexts/message-presenter.tsx';
import { MoreActionsIcon } from '../../../../../icons/MoreActionsIcon.ts';
import { ReplyIcon } from '../../../../../icons/ReplyIcon.ts';
import { formatDate } from '../../../../../utils/formatDate.ts';
import { formatTime } from '../../../../../utils/formatTime.ts';
import { getStringAvatarValueFromMailAddressList } from '../../../../../utils/getStringAvatarValueFromMailAddressList.ts';
import { useMailListItemTransientStatesBindingPersistence } from '../primary-components/mail-list-item-transient-states-binding-persistence.tsx';
import {
  MailListItemFormattedEmailAddresses,
  MailListItemFormattedEmailAddressesPlaceholder
} from './MailListItemFormattedEmailAddresses.tsx';
import { MailListItemTimeLabel } from './MailListItemTimeLabel.tsx';

const ns = 'ui';
const $moreActions = LOCALIZE('More Actions')({ ns });
const $reply = LOCALIZE('Reply')({ ns });
const $to = LOCALIZE('to')({ ns });

export interface MailListItemHeaderProps {
  mail: DecryptedViewMessage;
  showOptions: boolean;
  onClick: () => void;
}

export const MailListItemHeader = ({ mail, showOptions, onClick }: MailListItemHeaderProps) => {
  const mailListItemTransientStatesBindingPersistence = useMailListItemTransientStatesBindingPersistence();
  const { presentErrorMessage } = useMessagePresenter();
  const t = useT();

  const showFromGroupMembers = useBindingPersistence(
    useBinding(() => false, { id: 'showFromGroupMembers', detectChanges: true }),
    { storage: mailListItemTransientStatesBindingPersistence, isValid: () => true, key: `${mail.id}-showFromGroupMembers` }
  );

  const showToGroupMembers = useBindingPersistence(
    useBinding(() => false, { id: 'showToGroupMembers', detectChanges: true }),
    { storage: mailListItemTransientStatesBindingPersistence, isValid: () => true, key: `${mail.id}-showToGroupMembers` }
  );

  const onMoreActionsClick: React.MouseEventHandler<HTMLElement> = useCallbackRef((event) => {
    event.stopPropagation();

    // TODO: implement
    presentErrorMessage('This feature is not implemented yet.', { severity: 'error' });
  });

  const onReplyClick: React.MouseEventHandler<HTMLElement> = useCallbackRef((event) => {
    event.stopPropagation();

    // TODO: implement
    presentErrorMessage('This feature is not implemented yet.', { severity: 'error' });
  });

  return (
    <Stack direction="row" gap={1} className="flex-auto overflow-hidden cursor-pointer" onClick={onClick}>
      <Stack direction="row" gap={1.5} className="flex-auto overflow-hidden">
        <StringAvatar value={getStringAvatarValueFromMailAddressList(mail.from)} />
        <Stack className="flex-auto overflow-hidden">
          <Stack direction="row" justifyContent="space-between" className="flex-auto overflow-hidden">
            <MailListItemFormattedEmailAddresses addresses={mail.from} showGroupMembers={showFromGroupMembers} mode="from" />
            <Stack direction="row" alignItems="center" gap={2}>
              {mail.date !== undefined ? <MailListItemTimeLabel timeMSec={new Date(mail.date).getTime()} /> : null}
              {IF(showOptions, () => (
                <Stack direction="row" alignItems="center">
                  <Button sx={{ p: 1 }} title={$reply(t)} onClick={onReplyClick}>
                    <ReplyIcon className="sm-icon secondary-text" />
                  </Button>

                  <Button sx={{ p: 1 }} title={$moreActions(t)} onClick={onMoreActionsClick}>
                    <MoreActionsIcon className="sm-icon secondary-text" />
                  </Button>
                </Stack>
              ))}
            </Stack>
          </Stack>

          <Stack direction="row" alignItems="baseline" gap={1} className="flex-auto overflow-hidden">
            <Txt variant="body2" color="textDisabled">
              {$to(t)}
            </Txt>
            <Stack className="flex-auto overflow-hidden">
              <MailListItemFormattedEmailAddresses addresses={mail.to} showGroupMembers={showToGroupMembers} mode="to" />
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};

export const MailListItemHeaderPlaceholder = () => {
  const t = useT();

  return (
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
  );
};
