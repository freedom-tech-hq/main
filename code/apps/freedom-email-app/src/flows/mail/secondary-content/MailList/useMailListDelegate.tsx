import { ListItem, ListItemText } from '@mui/material';
import type { VirtualListDelegate, VirtualListItemPrototype } from 'freedom-web-virtual-list';
import { noop } from 'lodash-es';
import React, { useMemo } from 'react';

import type { MailListDataSourceItem } from './MailListDataSourceItem.ts';
import type { MailListKey } from './MailListKey.ts';
import type { MailListTemplateId } from './MailListTemplateId.ts';
import { CollapsedMailListItem } from './primary-components/CollapsedMailListItem.tsx';
import { MailListItem, MailListItemPlaceholder } from './primary-components/MailListItem.tsx';
import type { MailListDataSource } from './useMailListDataSource.ts';

export const useMailListDelegate = (dataSource: MailListDataSource) =>
  useMemo(
    (): VirtualListDelegate<MailListDataSourceItem, MailListKey, MailListTemplateId> => ({
      itemPrototypes,
      getTemplateIdForItemAtIndex: (index) => dataSource.getItemAtIndex(index).type,
      renderItem: (_key, item, index) => {
        const numItems = dataSource.getNumItems();

        switch (item.type) {
          // TODO: probably need a flag in DecryptedViewMessage to indicate if the message is a draft or not
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
          case 'collapsed':
            return <CollapsedMailListItem count={item.count} onClick={dataSource.expandCollapsedItems} />;
          case 'load-more':
            return <CollapsedMailListItem count={item.count} onClick={dataSource.loadMore} />;
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

const itemPrototypes: Record<MailListTemplateId, VirtualListItemPrototype> = {
  mail: {
    defaultEstimatedSizePx: 594,
    isSizeDynamic: true,
    Component: () => <MailListItemPlaceholder showDividerIfCollapsed={true} />
  },
  collapsed: {
    defaultEstimatedSizePx: 70,
    isSizeDynamic: false,
    Component: () => <CollapsedMailListItem count={0} onClick={noop} />
  },
  'load-more': {
    defaultEstimatedSizePx: 70,
    isSizeDynamic: false,
    Component: () => <CollapsedMailListItem count={0} onClick={noop} />
  }
};
