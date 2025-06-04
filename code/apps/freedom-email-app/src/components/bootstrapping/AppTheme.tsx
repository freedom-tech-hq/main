import type { Theme } from '@mui/material/styles';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

export type AppTheme = Theme;

export const AppThemeProvider = ({ children }: { children: ReactNode }) => {
  const theme = useMemo(() => {
    const theme = createTheme({
      cssVariables: true,
      breakpoints: { values: { xs: 0, sm: 320, md: 375, lg: 768, xl: 1440 } },
      components: {
        MuiListItemButton: {
          defaultProps: {
            disableRipple: true,
            disableTouchRipple: true,
            tabIndex: -1
          }
        }
      }
    });
    const appTheme = theme as AppTheme;

    return appTheme;
  }, []);

  return (
    <ThemeProvider theme={theme} disableTransitionOnChange={true}>
      {children}
    </ThemeProvider>
  );
};
