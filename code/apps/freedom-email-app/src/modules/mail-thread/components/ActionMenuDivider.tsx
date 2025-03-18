import type { Theme } from '@emotion/react';
import type { SxProps } from '@mui/material';
import { Divider } from '@mui/material';

export const ActionMenuDivider = () => <Divider orientation="vertical" sx={dividerStyle} />;

// Helpers

const dividerStyle: SxProps<Theme> = { height: '32px' };
