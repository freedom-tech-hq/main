import { CreateOutlined as ComposeIcon } from '@mui/icons-material';
import { AppBar, Box, Button, Stack, Toolbar, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import { useCallbackRef } from 'react-bindings';

import { useSelectedMailCollectionId } from '../contexts/selected-mail-collection.tsx';
import { useSelectedMailThreadId } from '../contexts/selected-mail-thread.tsx';
import { useTasks } from '../contexts/tasks.tsx';
import { NavBarSearchField } from './NavBarSearchField.tsx';
import { MAIN_MENU_WIDTH_PX } from './SideMenu.tsx';

const ns = 'ui';
const $appName = LOCALIZE('Freedom Mail')({ ns });
const $newMessageButtonTitle = LOCALIZE('New Message')({ ns });

export const AppNavbar = () => {
  const tasks = useTasks();
  const theme = useTheme();
  const t = useT();
  const selectedCollectionId = useSelectedMailCollectionId();
  const selectedThreadId = useSelectedMailThreadId();

  const onNewMessageClick = useCallbackRef(async () => {
    if (tasks === undefined) {
      return;
    }

    const draft = await tasks.createMailDraft();
    if (!draft.ok) {
      console.error('Failed to create draft', draft.value);
      return;
    }

    selectedCollectionId.set('drafts');
    selectedThreadId.set(draft.value.draftId);
  });

  return (
    <AppBar color="secondary" position="sticky" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
      <Toolbar variant="dense">
        <Stack direction="row" gap={2} alignItems="center" flexGrow={1}>
          <Typography variant="h6" component="h6" sx={{ width: `calc(${MAIN_MENU_WIDTH_PX}px - ${theme.spacing(4)})` }}>
            {$appName(t)}
          </Typography>
          <NavBarSearchField />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="text" startIcon={<ComposeIcon />} onClick={onNewMessageClick}>
            {$newMessageButtonTitle(t)}
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};
