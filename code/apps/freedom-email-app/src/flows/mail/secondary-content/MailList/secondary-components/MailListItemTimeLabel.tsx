import type { StackProps } from '@mui/material';
import { Stack } from '@mui/material';
import React from 'react';

import { Txt } from '../../../../../components/reusable/aliases/Txt.ts';
import { formatDate } from '../../../../../utils/formatDate.ts';
import { formatTime } from '../../../../../utils/formatTime.ts';

export interface MailListItemTimeLabelProps extends StackProps {
  timeMSec: number;
}

export const MailListItemTimeLabel = ({ timeMSec, ...props }: MailListItemTimeLabelProps) => (
  <Stack direction="row" gap={1} {...props}>
    <Txt variant="body2" color="textSecondary" className="whitespace-nowrap">
      {formatDate(timeMSec)}
    </Txt>
    <Txt variant="body2" color="textSecondary" className="whitespace-nowrap">
      {formatTime(timeMSec)}
    </Txt>
  </Stack>
);
