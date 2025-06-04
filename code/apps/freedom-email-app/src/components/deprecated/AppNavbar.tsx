import { CreateOutlined as ComposeIcon } from '@mui/icons-material';
import { AppBar, Box, Button, Stack, Toolbar, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { bestEffort } from 'freedom-async';
import { makeTrace } from 'freedom-contexts';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import { noop } from 'lodash-es';
import { useRef } from 'react';
import { BC, useCallbackRef, useDerivedBinding } from 'react-bindings';

import { useActiveLocallyStoredCredentialUuid } from '../../contexts/active-locally-stored-credential-uuid.tsx';
import { useActiveUserId } from '../../contexts/active-user-id.tsx';
import { useTasks } from '../../contexts/tasks.tsx';
import { useTransientContent } from '../../contexts/transient-content.tsx';
import { makeBrowserDownloadLocallyStoredEncryptedEmailCredential } from '../../utils/makeBrowserDownloadLocallyStoredEncryptedEmailCredential.ts';
import { ComposeEmailDialog } from './compose/ComposeEmailDialog.tsx';
import { NavBarSearchField } from './NavBarSearchField.tsx';
import { MAIN_MENU_WIDTH_PX } from './SideMenu.tsx';

const ns = 'ui';
const $appName = LOCALIZE('Freedom Mail')({ ns });
const $exportCredentialButtonTitle = LOCALIZE('Export Credential')({ ns });
const $newMessageButtonTitle = LOCALIZE('New Message')({ ns });

export const AppNavbar = () => {
  const activeLocallyStoredCredentialUuid = useActiveLocallyStoredCredentialUuid();
  const activeUserId = useActiveUserId();
  const t = useT();
  const tasks = useTasks();
  const theme = useTheme();
  const transientContent = useTransientContent();
  // const selectedCollectionId = useSelectedMailCollectionId();
  // const selectedThreadId = useSelectedMailThreadId();

  const hasActiveUserId = useDerivedBinding(activeUserId, (activeUserId) => activeUserId !== undefined, { id: 'hasActiveUserId' });

  const onExportCredentialClick = useCallbackRef(async () => {
    if (tasks === undefined) {
      console.error('Tasks not ready');
      return; // Not ready
    }

    const credentialUuid = activeLocallyStoredCredentialUuid.get();
    if (credentialUuid === undefined) {
      console.error('No active credential UUID');
      return; // Not ready
    }

    const trace = makeTrace(import.meta.filename, 'onExportCredentialClick');
    await bestEffort(trace, makeBrowserDownloadLocallyStoredEncryptedEmailCredential(trace, { tasks, credentialUuid }));
  });

  const dismissComposeMessageDialog = useRef<() => void>(noop);
  const onNewMessageClick = useCallbackRef(async () => {
    dismissComposeMessageDialog.current();
    dismissComposeMessageDialog.current = transientContent.present(({ dismiss }) => <ComposeEmailDialog dismiss={dismiss} />);
  });

  return (
    <AppBar color="secondary" position="sticky" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
      <Toolbar variant="dense">
        <Stack direction="row" gap={2} alignItems="center" flexGrow={1}>
          <Typography variant="h6" component="h6" sx={{ width: `calc(${MAIN_MENU_WIDTH_PX}px - ${theme.spacing(4)})` }}>
            {$appName(t)}
          </Typography>
          {BC(hasActiveUserId, (hasActiveUserId) =>
            hasActiveUserId ? (
              <>
                <NavBarSearchField />
                <Box sx={{ flexGrow: 1 }} />
                <Button variant="text" onClick={onExportCredentialClick}>
                  {$exportCredentialButtonTitle(t)}
                </Button>
                <Button variant="text" startIcon={<ComposeIcon />} onClick={onNewMessageClick}>
                  {$newMessageButtonTitle(t)}
                </Button>
              </>
            ) : null
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
};
