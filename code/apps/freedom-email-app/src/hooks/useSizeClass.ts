import type { Breakpoint } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useEffect } from 'react';
import { useBinding, useCallbackRef } from 'react-bindings';

export const useSizeClass = () => {
  const theme = useTheme();

  const determineSizeClass = useCallbackRef((): Breakpoint => {
    const width = window.visualViewport?.width ?? window.innerWidth;
    const breakpointValues = theme.breakpoints.values;
    console.log('breakpointValues', breakpointValues);
    if (width >= breakpointValues.xl) {
      return 'xl';
    } else if (width >= breakpointValues.lg) {
      return 'lg';
    } else if (width >= breakpointValues.md) {
      return 'md';
    } else if (width >= breakpointValues.sm) {
      return 'sm';
    } else {
      return 'xs';
    }
  });

  const sizeClass = useBinding<Breakpoint>(determineSizeClass, { id: 'sizeClass', detectChanges: true });

  const onSizeChange = () => {
    sizeClass.set(determineSizeClass());
  };

  useEffect(() => {
    (window.visualViewport ?? window).addEventListener('resize', onSizeChange);

    return () => (window.visualViewport ?? window).removeEventListener('resize', onSizeChange);
  });

  return sizeClass;
};
