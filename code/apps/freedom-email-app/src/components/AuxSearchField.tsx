import { SearchOutlined as SearchIcon } from '@mui/icons-material';
import type { SxProps, Theme } from '@mui/material';
import { Input } from '@mui/material';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';

const ns = 'ui';
const $searchFieldPlaceholder = LOCALIZE('Search')({ ns });

export const AuxSearchField = () => {
  const t = useT();

  return (
    <Input
      size="small"
      placeholder={$searchFieldPlaceholder(t)}
      type="search"
      startAdornment={<SearchIcon sx={searchIconStyle} />}
      disableUnderline={true}
      sx={searchFieldStyle}
    />
  );
};

// Helpers

const searchIconStyle: SxProps<Theme> = { color: 'rgba(0,0,0,0.5)', width: '18px', height: '18px' };
const searchFieldStyle: SxProps<Theme> = {
  borderRadius: '16px',
  backgroundColor: 'rgba(0,0,0,0.1)',
  fontSize: '0.75rem',
  px: 0.75,
  py: 0.375,
  '& .MuiInput-input': {
    p: 0
  }
};
