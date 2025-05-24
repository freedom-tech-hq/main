import type { Theme } from '@mui/material/styles';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

export type AppTheme = Theme;

export const AppThemeProvider = ({ children }: { children: ReactNode }) => {
  const theme = useMemo(() => {
    const theme = createTheme({
      typography: {
        body1: {
          fontSize: '17px'
        },
        body2: {
          fontSize: '15px'
        },
        caption: {
          fontSize: '13px'
        },
        button: {
          fontSize: '17px'
        },
        h1: {
          fontSize: '24px',
          fontWeight: 'bold'
        },
        h2: {
          fontSize: '21px',
          fontWeight: 'bold'
        },
        h3: {
          fontSize: '20px',
          fontWeight: 'bold'
        },
        h4: {
          fontSize: '19px',
          fontWeight: 'bold'
        },
        h5: {
          fontSize: '18px',
          fontWeight: 'bold'
        },
        h6: {
          fontSize: '17px',
          fontWeight: 'bold'
        }
      },
      palette: {
        action: {
          hover: 'transparent',
          hoverOpacity: 0
        },
        background: {
          default: '#eee'
        },
        secondary: {
          main: '#22222a'
        }
      },
      components: {
        MuiListItemButton: {
          defaultProps: {
            disableRipple: true,
            disableTouchRipple: true,
            tabIndex: -1
          }
        },
        MuiListItemIcon: {
          styleOverrides: {
            root: {
              minWidth: '32px'
            }
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
