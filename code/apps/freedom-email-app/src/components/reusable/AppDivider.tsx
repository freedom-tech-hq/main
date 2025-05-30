import { Stack } from '@mui/material';
import React from 'react';

import { Txt } from './aliases/Txt.ts';

export interface AppDividerProps {
  label?: string;
}

export const AppDivider = ({ label }: AppDividerProps) => {
  if (label === undefined) {
    return <hr className="w-full" />;
  } else {
    return (
      <Stack alignItems="center" gap={2} direction="row" className="w-full">
        <hr className="flex-auto" />
        <Txt variant="body2" className="secondary-text">
          {label}
        </Txt>
        <hr className="flex-auto" />
      </Stack>
    );
  }
};
