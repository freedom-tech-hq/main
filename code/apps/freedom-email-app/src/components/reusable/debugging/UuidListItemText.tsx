import { ListItemText } from '@mui/material';
import { makeUuid } from 'freedom-contexts';
import React, { useMemo } from 'react';

export interface UuidListItemTextProps {
  short?: boolean;
}

export const UuidListItemText = ({ short = true }: UuidListItemTextProps) => {
  let uuid: string = useMemo(() => makeUuid(), []);
  if (short) {
    uuid = uuid.slice(0, 8);
  }

  return <ListItemText primary={uuid} />;
};
