import { ListItem, ListItemText } from '@mui/material';
import type { MailId } from 'freedom-email-sync';
import { mailIdInfo } from 'freedom-email-sync';
import type { Mail } from 'freedom-email-user';
import type { VirtualListDelegate } from 'freedom-web-virtual-list';
import { noop } from 'lodash-es';
import React, { useMemo } from 'react';

import { CollapsedMailListItem } from './CollapsedMailListItem.tsx';
import type { MailListDataSourceItem } from './MailListDataSourceItem.ts';
import { MailListItem, MailListItemPlaceholder } from './MailListItem.tsx';
import type { MailListKey } from './MailListKey.ts';
import type { MailListTemplateId } from './MailListTemplateId.ts';
import type { MailListDataSource } from './useMailListDataSource.ts';

export const useMailListDelegate = (dataSource: MailListDataSource) =>
  useMemo(
    (): VirtualListDelegate<MailListDataSourceItem, MailListKey, MailListTemplateId> => ({
      itemPrototypes,
      getTemplateIdForItemAtIndex: (index) => dataSource.getItemAtIndex(index).type,
      renderItem: (_key, item, index) => {
        const numItems = dataSource.getNumItems();

        switch (item.type) {
          case 'mail': {
            const collapsedByDefault = (dataSource.hasCollapsedItems() || numItems > 1) && index < numItems - 1;
            return (
              <MailListItem
                {...item}
                collapsedByDefault={collapsedByDefault}
                showDividerIfCollapsed={dataSource.getItemAtIndex(index + 1)?.type !== 'collapsed'}
                showOptionsPerMessage={numItems > 1}
              />
            );
          }
          case 'draft':
            // TODO: support
            return <></>;
          // return <MailDraftListItem {...item} isFirst={index === 0} tag={item.id} />;
          case 'collapsed':
            return <CollapsedMailListItem count={item.count} onClick={dataSource.expandCollapsedItems} />;
        }
      },
      loadingIndicatorTransitionDurationMSec: 0,
      renderEmptyIndicator: () => (
        <ListItem>
          <ListItemText secondary="No Mail Found" />
        </ListItem>
      ),
      renderLoadingIndicator: () => <MailListItemPlaceholder />
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
    defaultEstimatedSizePx: 594,
    isSizeDynamic: true,
    Component: () => (
      <MailListItem
        id={prototypeMail.id}
        mail={prototypeMail}
        collapsedByDefault={false}
        showDividerIfCollapsed={true}
        showOptionsPerMessage={false}
      />
    )
  },
  draft: {
    defaultEstimatedSizePx: 594,
    isSizeDynamic: true,
    // TODO: support
    Component: () => <></>
    // Component: () => <MailDraftListItem id={prototypeDraft.id} isFirst={true} mail={prototypeDraft} tag={undefined} />
  },
  collapsed: {
    defaultEstimatedSizePx: 70,
    isSizeDynamic: false,
    Component: () => <CollapsedMailListItem count={0} onClick={noop} />
  }
};
