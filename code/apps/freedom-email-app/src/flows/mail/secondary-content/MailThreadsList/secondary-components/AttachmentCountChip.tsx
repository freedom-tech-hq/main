import { Box, Chip } from '@mui/material';
import React from 'react';

import { AttachmentIcon } from '../../../../../icons/AttachmentIcon.ts';
import { formatInt } from '../../../../../utils/formatInt.ts';

export interface AttachmentCountChipProps {
  count: number;
}

export const AttachmentCountChip = ({ count }: AttachmentCountChipProps) => (
  <Chip variant="outlined" icon={<AttachmentIcon className="sm-icon" />} label={formatInt(count)} className="AttachmentCountChip" />
);

export const AttachmentCountChipPlaceholder = () => (
  <Box className="input-border-bg" sx={{ width: '50px', height: '30px', borderRadius: '15px' }} />
);
