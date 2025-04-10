import { CircularProgress, ListItem, ListItemText } from '@mui/material';
import type { MailId } from 'freedom-email-sync';
import { mailIdInfo } from 'freedom-email-sync';
import type { Mail, MailDraftId, MailLikeId } from 'freedom-email-user';
import { mailDraftIdInfo } from 'freedom-email-user';
import { useMemo } from 'react';

import type { DataSource } from '../../../types/DataSource.ts';
import type { VirtualListDelegate } from '../../virtual-list/types/VirtualListDelegate.ts';
import { MailDraftListItem } from '../components/MailDraftListItem.tsx';
import { MailListItem } from '../components/MailListItem.tsx';
import type { MailThreadDataSourceItem } from '../types/MailThreadDataSourceItem.ts';

export const useMailThreadDelegate = (dataSource: DataSource<MailThreadDataSourceItem, MailLikeId>) =>
  useMemo(
    (): VirtualListDelegate<MailThreadDataSourceItem, MailLikeId, 'mail' | 'draft'> => ({
      itemPrototypes,
      getTemplateIdForItemAtIndex: (index) => dataSource.getItemAtIndex(index).type,
      renderItem: (_key, item, index) => {
        switch (item.type) {
          case 'mail':
            return <MailListItem {...item} isFirst={index === 0} tag={item.id} />;
          case 'draft':
            return <MailDraftListItem {...item} isFirst={index === 0} tag={item.id} />;
        }
      },
      renderEmptyIndicator: () => (
        <ListItem>
          <ListItemText secondary="No Mail Found" />
        </ListItem>
      ),
      renderLoadingIndicator: () => (
        <ListItem sx={{ justifyContent: 'center' }}>
          <CircularProgress size={22} />
        </ListItem>
      )
    }),
    [dataSource]
  );

const prototypeMail: Mail & { id: MailId } = {
  id: mailIdInfo.make(),
  from: 'hello@freedomtechhq.com',
  to: ['hello@freedomtechhq.com'],
  subject: 'Prototype',
  body: 'Prototype',
  timeMSec: Date.now(),
  isUnread: true
};
const prototypeDraft: Mail & { id: MailDraftId } = {
  id: mailDraftIdInfo.make(),
  from: 'hello@freedomtechhq.com',
  to: ['hello@freedomtechhq.com'],
  subject: 'Prototype',
  body: 'Prototype',
  timeMSec: Date.now(),
  isUnread: true
};
const itemPrototypes = {
  mail: {
    defaultEstimatedSizePx: 320,
    isSizeDynamic: true,
    Component: () => <MailListItem id={prototypeMail.id} isFirst={true} mail={prototypeMail} tag={undefined} />
  },
  draft: {
    defaultEstimatedSizePx: 320,
    isSizeDynamic: true,
    Component: () => <MailDraftListItem id={prototypeDraft.id} isFirst={true} mail={prototypeDraft} tag={undefined} />
  }
};
