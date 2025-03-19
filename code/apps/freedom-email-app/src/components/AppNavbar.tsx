import { CreateOutlined as ComposeIcon } from '@mui/icons-material';
import { AppBar, Box, Button, Stack, Toolbar, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';

import { NavBarSearchField } from './NavBarSearchField.tsx';
import { MAIN_MENU_WIDTH_PX } from './SideMenu.tsx';

const ns = 'ui';
const $appName = LOCALIZE('Freedom Mail')({ ns });
const $newMessageButtonTitle = LOCALIZE('New Message')({ ns });

export const AppNavbar = () => {
  const theme = useTheme();
  const t = useT();

  return (
    <AppBar color="secondary" position="sticky" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
      <Toolbar variant="dense">
        <Stack direction="row" gap={2} alignItems="center" flexGrow={1}>
          <Typography variant="h6" component="h6" sx={{ width: `calc(${MAIN_MENU_WIDTH_PX}px - ${theme.spacing(4)})` }}>
            {$appName(t)}
          </Typography>
          <NavBarSearchField />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="text" startIcon={<ComposeIcon />}>
            {$newMessageButtonTitle(t)}
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};
