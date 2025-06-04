import { Stack, useTheme } from '@mui/material';
import type { ReactNode } from 'react';

export const AppToolbar = ({ children }: { children: ReactNode }) => {
  const theme = useTheme();

  return (
    <Stack
      className="AppToolbar"
      direction="row"
      alignItems="center"
      gap={1}
      sx={{ p: 1.5, minHeight: `calc(${theme.spacing(3)} + 32px)` }}
    >
      {children}
    </Stack>
  );
};
