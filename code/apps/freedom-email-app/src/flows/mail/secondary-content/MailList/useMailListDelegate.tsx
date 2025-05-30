import { CircularProgress, ListItem, ListItemText } from '@mui/material';
import type { DataSource } from 'freedom-data-source';
import type { MailId } from 'freedom-email-sync';
import { mailIdInfo } from 'freedom-email-sync';
import type { Mail, MailLikeId } from 'freedom-email-user';
import type { VirtualListDelegate } from 'freedom-web-virtual-list';
import React, { useMemo } from 'react';

import type { MailListDataSourceItem } from './MailListDataSourceItem.ts';
import { MailListItem } from './MailListItem.tsx';

export const useMailListDelegate = (dataSource: DataSource<MailListDataSourceItem, MailLikeId>) =>
  useMemo(
    (): VirtualListDelegate<MailListDataSourceItem, MailLikeId, 'mail' | 'draft'> => ({
      itemPrototypes,
      getTemplateIdForItemAtIndex: (index) => dataSource.getItemAtIndex(index).type,
      renderItem: (_key, item, _index) => {
        switch (item.type) {
          case 'mail':
            return <MailListItem {...item} />;
          case 'draft':
            // TODO: support
            return <></>;
          // return <MailDraftListItem {...item} isFirst={index === 0} tag={item.id} />;
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
  isUnread: true,
  attachments: []
};
// const prototypeDraft: Mail & { id: MailDraftId } = {
//   id: mailDraftIdInfo.make(),
//   from: 'hello@freedomtechhq.com',
//   to: ['hello@freedomtechhq.com'],
//   subject: 'Prototype',
//   body: 'Prototype',
//   timeMSec: Date.now(),
//   isUnread: true
// };
const itemPrototypes = {
  mail: {
    defaultEstimatedSizePx: 320,
    isSizeDynamic: true,
    Component: () => <MailListItem id={prototypeMail.id} mail={prototypeMail} />
  },
  draft: {
    defaultEstimatedSizePx: 320,
    isSizeDynamic: true,
    // TODO: support
    Component: () => <></>
    // Component: () => <MailDraftListItem id={prototypeDraft.id} isFirst={true} mail={prototypeDraft} tag={undefined} />
  }
};
