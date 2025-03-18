import { SearchOutlined as SearchIcon } from '@mui/icons-material';
import type { SxProps, Theme } from '@mui/material';
import { Input, useTheme } from '@mui/material';

import { MAIL_MENU_WIDTH_PX } from './SideMenu.tsx';

export const NavBarSearchField = () => {
  const theme = useTheme();

  return (
    <Input
      size="small"
      placeholder="Search"
      type="search"
      startAdornment={<SearchIcon sx={searchIconStyle} />}
      disableUnderline={true}
      sx={{
        ...searchFieldStyle,
        width: `calc(${MAIL_MENU_WIDTH_PX}px - ${theme.spacing(2)})`,
        backgroundColor: theme.palette.getContrastText(theme.palette.primary.main)
      }}
    />
  );
};

// Helpers

const searchIconStyle: SxProps<Theme> = { color: 'rgba(0,0,0,0.5)' };
const searchFieldStyle: SxProps<Theme> = {
  borderRadius: '16px',
  px: 1,
  py: 0.5,
  '& .MuiInput-input': {
    p: 0
  }
};
