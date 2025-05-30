import type { StackProps } from '@mui/material';
import { Stack, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import React from 'react';

export type AppToolbarProps = StackProps;

export const AppToolbar = ({ children, ...props }: AppToolbarProps & { children?: ReactNode }) => {
  const theme = useTheme();

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={1}
      {...props}
      sx={{ p: 1.5, minHeight: `calc(${theme.spacing(3)} + 32px)`, ...props.sx }}
    >
      {children}
    </Stack>
  );
};
