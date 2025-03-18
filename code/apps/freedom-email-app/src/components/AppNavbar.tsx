import { CreateOutlined as ComposeIcon } from '@mui/icons-material';
import { AppBar, Box, Button, Stack, Toolbar, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { NavBarSearchField } from './NavBarSearchField.tsx';
import { MAIN_MENU_WIDTH_PX } from './SideMenu.tsx';

export const AppNavbar = () => {
  const theme = useTheme();

  return (
    <AppBar position="sticky" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
      <Toolbar variant="dense">
        <Stack direction="row" gap={2} alignItems="center" flexGrow={1}>
          <Typography variant="h6" component="h6" sx={{ width: `calc(${MAIN_MENU_WIDTH_PX}px - ${theme.spacing(4)})` }}>
            Freedom Mail
          </Typography>
          <NavBarSearchField />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="text" color="secondary" startIcon={<ComposeIcon />}>
            New Message
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};
