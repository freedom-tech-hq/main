import { useTheme } from '@mui/material';

import type { AppTheme } from '../components/bootstrapping/AppTheme.tsx';

export const useAppTheme = () => useTheme<AppTheme>();
