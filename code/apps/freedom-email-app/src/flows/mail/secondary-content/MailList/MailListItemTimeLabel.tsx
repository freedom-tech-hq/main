import type { StackProps } from '@mui/material';
import { Stack, Typography } from '@mui/material';
import React from 'react';

import { formatDate } from '../../../../utils/formatDate.ts';
import { formatTime } from '../../../../utils/formatTime.ts';

export interface MailListItemTimeLabelProps extends StackProps {
  timeMSec: number;
}

export const MailListItemTimeLabel = ({ timeMSec, ...props }: MailListItemTimeLabelProps) => (
  <Stack direction="row" gap={1} {...props}>
    <Typography variant="body2" color="textSecondary" className="whitespace-nowrap">
      {formatDate(timeMSec)}
    </Typography>
    <Typography variant="body2" color="textSecondary" className="whitespace-nowrap">
      {formatTime(timeMSec)}
    </Typography>
  </Stack>
);
