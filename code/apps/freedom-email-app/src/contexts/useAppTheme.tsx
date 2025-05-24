import { useTheme } from '@mui/material';

import type { AppTheme } from '../components/AppTheme.tsx';

export const useAppTheme = () => useTheme<AppTheme>();
