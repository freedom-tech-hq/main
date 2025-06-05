import { Button, Divider, Stack } from '@mui/material';
import React from 'react';

import { Txt } from '../../../../components/reusable/aliases/Txt.ts';
import { formatInt } from '../../../../utils/formatInt.ts';

export interface CollapsedMailListItemProps {
  count: number;
  onClick: () => void;
}

export const CollapsedMailListItem = ({ count, onClick }: CollapsedMailListItemProps) => (
  <Stack
    alignSelf="stretch"
    justifyContent="center"
    alignItems="center"
    className="relative cursor-pointer"
    sx={{ my: 3 }}
    onClick={onClick}
  >
    <Divider className="absolute left-0 right-0" sx={{ top: 'calc(50% - 2px)' }} />
    <Divider className="absolute left-0 right-0" sx={{ top: 'calc(50% + 2px)' }} />
    <Button
      variant="outlined"
      onClick={onClick}
      sx={{ backgroundColor: 'var(--colors-background)', borderColor: 'var(--colors-input-border)', px: '10px', py: '2px' }}
    >
      <Txt color="textPrimary" variant="caption">
        {formatInt(count)}
      </Txt>
    </Button>
  </Stack>
);
