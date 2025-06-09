import React from 'react';

import type { TxtProps } from '../../../../../components/reusable/aliases/Txt.ts';
import { Txt } from '../../../../../components/reusable/aliases/Txt.ts';
import { formatDate } from '../../../../../utils/formatDate.ts';
import { formatTime } from '../../../../../utils/formatTime.ts';

const enSpace = '\u2002';

export interface MailListItemTimeLabelProps extends TxtProps {
  timeMSec: number;
}

export const MailListItemTimeLabel = ({ timeMSec, ...props }: MailListItemTimeLabelProps) => (
  <Txt variant="body2" color="textSecondary" className="whitespace-nowrap" {...props}>
    {`${formatDate(timeMSec)}${enSpace}${formatTime(timeMSec)}`}
  </Txt>
);
