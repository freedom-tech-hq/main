import type { ListItemTextSlotsAndSlotProps, SxProps, Theme } from '@mui/material';
import { ListItem, ListItemText } from '@mui/material';

import type { MailCollectionsListGroupTitleDataSourceItem } from '../types/MailCollectionsListGroupTitleDataSourceItem.ts';

export type MailCollectionGroupTitleListItemProps = Omit<MailCollectionsListGroupTitleDataSourceItem, 'type'>;

export const MailCollectionGroupTitleListItem = ({ title }: MailCollectionGroupTitleListItemProps) => (
  <ListItem sx={noVerticalPaddingStyle}>
    <ListItemText secondary={title} slotProps={boldSecondarySlotProps} sx={noMarginStyle} />
  </ListItem>
);

// Helpers

const boldSecondarySlotProps: ListItemTextSlotsAndSlotProps['slotProps'] = { secondary: { fontWeight: 'bold' } };
const noVerticalPaddingStyle: SxProps<Theme> = { py: 0 };
const noMarginStyle: SxProps<Theme> = { m: 0 };
