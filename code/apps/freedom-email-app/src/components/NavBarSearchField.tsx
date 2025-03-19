import { SearchOutlined as SearchIcon } from '@mui/icons-material';
import type { SxProps, Theme } from '@mui/material';
import { Input, useTheme } from '@mui/material';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';

import { MAIL_MENU_WIDTH_PX } from './SideMenu.tsx';

const ns = 'ui';
const $searchFieldPlaceholder = LOCALIZE('Search')({ ns });

export const NavBarSearchField = () => {
  const t = useT();
  const theme = useTheme();

  return (
    <Input
      size="small"
      placeholder={$searchFieldPlaceholder(t)}
      type="search"
      startAdornment={<SearchIcon sx={searchIconStyle} />}
      disableUnderline={true}
      sx={{
        ...searchFieldStyle,
        width: `calc(${MAIL_MENU_WIDTH_PX}px - ${theme.spacing(2)})`,
        backgroundColor: theme.palette.common.white
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
