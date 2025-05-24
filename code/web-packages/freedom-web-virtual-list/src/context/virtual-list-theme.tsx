import { useTheme } from '@mui/material';
import { makeShortUid } from 'freedom-contexts';
import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';

import { GlobalVirtualListStyles } from '../internal/components/GlobalVirtualListStyles.tsx';
import type { VirtualListTheme } from '../types/VirtualListTheme.ts';

const VirtualListThemeContext = createContext<VirtualListTheme | undefined>(undefined);

export const useVirtualListTheme = (): VirtualListTheme => {
  const virtualListTheme = useContext(VirtualListThemeContext);
  if (virtualListTheme === undefined) {
    throw new Error('useVirtualListTheme must be used within a VirtualListThemeProvider');
  }

  return virtualListTheme;
};

export const VirtualListThemeProvider = ({
  children,
  virtualListTheme
}: {
  children: ReactNode;
  virtualListTheme?: Omit<VirtualListTheme, 'uid'>;
}) => {
  const theme = useTheme();
  const virtualListThemeWithUid = useMemo<VirtualListTheme>(
    () => ({
      uid: makeShortUid(),
      ...(virtualListTheme ?? {
        palette: {
          list: {
            focused: {
              listItem: {
                selected: {
                  backgroundColor: theme.palette.primary.main,
                  iconColor: theme.palette.common.white,
                  color: theme.palette.common.white
                },
                unselected: {
                  backgroundColor: theme.palette.background.paper,
                  iconColor: theme.palette.primary.main,
                  color: theme.palette.text.primary
                }
              }
            },
            unfocused: {
              listItem: {
                selected: {
                  backgroundColor: theme.palette.grey[200],
                  iconColor: theme.palette.primary.main,
                  color: theme.palette.text.primary
                },
                unselected: {
                  backgroundColor: theme.palette.background.paper,
                  iconColor: theme.palette.primary.main,
                  color: theme.palette.text.primary
                }
              }
            }
          }
        }
      })
    }),
    [theme, virtualListTheme]
  );

  return (
    <VirtualListThemeContext.Provider value={virtualListThemeWithUid}>
      <GlobalVirtualListStyles />
      {children}
    </VirtualListThemeContext.Provider>
  );
};
