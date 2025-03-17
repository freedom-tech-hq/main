import { createTheme, ThemeProvider } from '@mui/material/styles';
import React from 'react';

export const AppTheme = ({ children }: { children: React.ReactNode }) => {
  const theme = React.useMemo(() => {
    return createTheme({
      palette: {
        action: {
          hover: 'transparent',
          hoverOpacity: 0
        },
        background: {
          default: '#eee'
        }
      },
      components: {
        MuiListItemButton: {
          defaultProps: {
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
  }, []);

  return (
    <ThemeProvider theme={theme} disableTransitionOnChange={true}>
      {children}
    </ThemeProvider>
  );
};
