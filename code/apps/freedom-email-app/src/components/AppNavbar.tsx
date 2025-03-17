import { AppBar, Stack, Toolbar, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export const AppNavbar = () => {
  const theme = useTheme();

  return (
    <AppBar position="sticky" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
      <Toolbar variant="dense">
        <Stack direction="row" sx={{ alignItems: 'center' }}>
          <Typography variant="h6" component="h6">
            Freedom Mail
          </Typography>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};
