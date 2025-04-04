import { CircularProgress, ListItem, ListItemText } from '@mui/material';
import { useMemo } from 'react';

import type { DataSource } from '../../../types/DataSource.ts';
import type { Mail } from '../../mail-types/Mail.ts';
import type { MailId } from '../../mail-types/MailId.ts';
import { mailIdInfo } from '../../mail-types/MailId.ts';
import type { VirtualListDelegate } from '../../virtual-list/types/VirtualListDelegate.ts';
import { MailListItem } from '../components/MailListItem.tsx';
import type { MailThreadDataSourceItem } from '../types/MailThreadDataSourceItem.ts';

export const useMailThreadDelegate = (
  dataSource: DataSource<MailThreadDataSourceItem, MailId>
): VirtualListDelegate<MailThreadDataSourceItem, MailId, 'mail'> => {
  return useMemo(
    (): VirtualListDelegate<MailThreadDataSourceItem, MailId, 'mail'> => ({
      itemPrototypes,
      getTemplateIdForItemAtIndex: (index) => dataSource.getItemAtIndex(index).type,
      renderItem: (_key, item, index) => {
        switch (item.type) {
          case 'mail':
            return <MailListItem {...item} isFirst={index === 0} tag={item.id} />;
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
};

const prototypeMail: Mail = {
  id: mailIdInfo.make(),
  from: 'hello@freedomtechhq.com',
  to: 'hello@freedomtechhq.com',
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
  }
};
