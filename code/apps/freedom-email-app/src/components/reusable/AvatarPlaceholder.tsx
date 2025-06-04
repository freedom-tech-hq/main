import type { AvatarProps } from '@mui/material';
import { Avatar } from '@mui/material';
import React from 'react';

export type AvatarPlaceholderProps = AvatarProps;

export const AvatarPlaceholder = (props: AvatarPlaceholderProps) => (
  <Avatar {...props} className={`AvatarPlaceholder ${props.className ?? ''}`}>
    &nbsp;
  </Avatar>
);
