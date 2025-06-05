import type { AvatarProps } from '@mui/material';
import { Avatar } from '@mui/material';
import React from 'react';

import { makeStringAvatarProps } from '../../utils/makeStringAvatarProps.ts';
import { AvatarPlaceholder } from './AvatarPlaceholder.tsx';

export interface StringAvatarProps extends AvatarProps {
  value: string | undefined;
}

export const StringAvatar = ({ value, ...props }: StringAvatarProps) => {
  if (value === undefined) {
    return <AvatarPlaceholder {...props} />;
  }

  const computedProps = makeStringAvatarProps(value);
  return <Avatar {...computedProps} {...props} sx={{ ...computedProps.sx, ...props.sx } as AvatarProps['sx']} />;
};
