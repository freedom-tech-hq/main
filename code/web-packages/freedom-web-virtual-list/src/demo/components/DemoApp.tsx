import { CssBaseline } from '@mui/material';

import { VirtualListThemeProvider } from '../../context/virtual-list-theme.tsx';
import { DemoAppContent } from './DemoAppContent.tsx';

export const DemoApp = () => {
  return (
    <VirtualListThemeProvider>
      <CssBaseline enableColorScheme={true} />
      <DemoAppContent />
    </VirtualListThemeProvider>
  );
};
