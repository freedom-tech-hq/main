import type { AvatarProps } from '@mui/material';
import { Avatar } from '@mui/material';
import React from 'react';

import { makeStringAvatarProps } from '../../utils/makeStringAvatarProps.ts';

export interface StringAvatarProps extends AvatarProps {
  value: string;
}

export const StringAvatar = ({ value, ...props }: StringAvatarProps) => {
  const computedProps = makeStringAvatarProps(value);
  return <Avatar {...computedProps} {...props} sx={{ ...computedProps.sx, ...props.sx } as AvatarProps['sx']} />;
};
