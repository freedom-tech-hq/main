import type { StackProps } from '@mui/material';
import { Stack } from '@mui/material';
import type { ReactNode } from 'react';
import React from 'react';

import { sp } from '../bootstrapping/AppTheme.tsx';

export type AppToolbarProps = StackProps;

export const AppToolbar = ({ children, ...props }: AppToolbarProps & { children?: ReactNode }) => (
  <Stack direction="row" alignItems="center" gap={1} {...props} sx={{ p: 1.5, minHeight: `${sp(3) + 32}px`, ...props.sx }}>
    {children}
  </Stack>
);
