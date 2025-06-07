import { Stack } from '@mui/material';
import type { MailMessagesDataSetId } from 'freedom-email-tasks-web-worker/lib/types/mail/MailMessagesDataSetId';
import { useBindingPersistence } from 'freedom-react-binding-persistence';
import React from 'react';
import type { ReadonlyBinding } from 'react-bindings';
import { useBinding, useCallbackRef } from 'react-bindings';
import { WC } from 'react-waitables';

import { useTaskWaitable } from '../../../../../hooks/useTaskWaitable.ts';
import type { MailListDataSourceMailItem } from '../MailListDataSourceItem.ts';
import { MailListItemDetail, MailListItemDetailPlaceholder } from '../secondary-components/MailListItemDetail.tsx';
import { MailListItemHeader, MailListItemHeaderPlaceholder } from '../secondary-components/MailListItemHeader.tsx';
import { useMailListItemTransientStatesBindingPersistence } from './mail-list-item-transient-states-binding-persistence.tsx';

export interface MailListItemProps extends Omit<MailListDataSourceMailItem, 'type'> {
  dataSetId: MailMessagesDataSetId;
  collapsedByDefault: boolean;
  showDividerIfCollapsed: boolean;
  showOptionsPerMessage: boolean;
}

export const MailListItem = ({ id, dataSetId, collapsedByDefault, showDividerIfCollapsed, showOptionsPerMessage }: MailListItemProps) => {
  const mailListItemTransientStatesBindingPersistence = useMailListItemTransientStatesBindingPersistence();

  const mail = useTaskWaitable((tasks) => tasks.getMail(dataSetId, id), { id: 'mail' });

  const isCollapsed = useBindingPersistence(
    useBinding(() => collapsedByDefault, { id: 'isCollapsed', detectChanges: true }),
    { storage: mailListItemTransientStatesBindingPersistence, isValid: (value) => value !== undefined, key: `${id}-isCollapsed` }
  );

  const onHeaderClick = useCallbackRef(() => isCollapsed.set(!isCollapsed.get()));

  return WC(
    mail,
    (mail) => (
      <Stack className="default-bg">
        <MailListItemHeader mail={mail} showOptions={showOptionsPerMessage} onClick={onHeaderClick} />
        <MailListItemDetail mail={mail} showDividerIfCollapsed={showDividerIfCollapsed} isCollapsed={isCollapsed} />
      </Stack>
    ),
    () => <MailListItemPlaceholder showDividerIfCollapsed={showDividerIfCollapsed} isCollapsed={isCollapsed} />
  );
};

export const MailListItemPlaceholder = ({
  showDividerIfCollapsed = false,
  isCollapsed
}: {
  showDividerIfCollapsed?: boolean;
  isCollapsed?: ReadonlyBinding<boolean>;
}) => (
  <Stack className="default-bg">
    <MailListItemHeaderPlaceholder />
    <MailListItemDetailPlaceholder showDividerIfCollapsed={showDividerIfCollapsed} isCollapsed={isCollapsed} />
  </Stack>
);
