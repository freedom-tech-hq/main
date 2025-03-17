// Ref: based on the code in https://mui.com/material-ui/react-avatar/

import type { AvatarProps } from '@mui/material';

export const makeStringAvatarProps = (name: string): AvatarProps => {
  const initials = getInitialsForName(name);
  return {
    sx: { bgcolor: stringToColor(name) },
    children: initials
  };
};

// Helpers

const getInitialsForName = (name: string) =>
  name
    .normalize('NFD')
    .split(/[^a-zA-Z]+/)
    .map((part) => part[0] ?? '')
    .join('')
    .substring(0, 2)
    .toLocaleUpperCase();

const stringToColor = (string: string) => {
  let hash = 0;
  let i;

  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }

  return color;
};
