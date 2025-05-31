import type { SvgIconProps } from '@mui/material';
import React from 'react';

import { EmptyIcon } from '../../icons/EmptyIcon.ts';

export type IconPlaceholderProps = SvgIconProps;

export const IconPlaceholder = (props: IconPlaceholderProps) => (
  <EmptyIcon {...props} className={`IconPlaceholder ${props.className ?? ''}`}>
    &nbsp;
  </EmptyIcon>
);
