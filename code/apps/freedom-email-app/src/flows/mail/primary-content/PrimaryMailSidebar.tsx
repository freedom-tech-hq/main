import { Box, Button, Stack } from '@mui/material';
import { makeUuid } from 'freedom-contexts';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import React, { useMemo } from 'react';
import { useCallbackRef } from 'react-bindings';

import { Txt } from '../../../components/reusable/aliases/Txt.ts';
import { AppToolbar } from '../../../components/reusable/AppToolbar.tsx';
import { $appName } from '../../../consts/common-strings.ts';
import { primarySidebarWidthPx } from '../../../consts/sizes.ts';
import { useSelectedMailThreadId } from '../../../contexts/selected-mail-thread.tsx';
import { CompanyLogoIcon } from '../../../icons/CompanyLogoIcon.ts';
import { NewEmailIcon } from '../../../icons/NewEmailIcon.ts';
import { MailCollectionsList } from '../secondary-content/MailCollectionsList/index.tsx';
import { ActiveAccountButton } from './ActiveAccountButton.tsx';

const ns = 'ui';
const $newEmail = LOCALIZE('New Email')({ ns });

export const PrimaryMailSidebar = () => {
  const selectedThread = useSelectedMailThreadId();
  const t = useT();
  const uuid = useMemo(() => makeUuid(), []);

  const onNewMailClick = useCallbackRef(() => {
    selectedThread.set('new-mail');
  });

  return (
    <Stack alignItems="stretch" className="relative default-bg z-10" sx={{ width: `${primarySidebarWidthPx}px` }}>
      <Stack alignItems="stretch" id={`${uuid}-scrollable`} className="overflow-y-auto">
        <AppToolbar>
          <CompanyLogoIcon color="primary" className="md-icon" />
          <Txt variant="body1">{$appName(t)}</Txt>
        </AppToolbar>

        <Button
          type="submit"
          variant="contained"
          startIcon={<NewEmailIcon className="primary-contrast sm-icon" />}
          sx={{ mx: 1.5, my: 1 }}
          onClick={onNewMailClick}
        >
          {$newEmail(t)}
        </Button>

        <Stack alignItems="stretch" sx={{ mx: 1.5, my: 1 }}>
          {/* TODO: handle onArrowLeft/right */}
          <MailCollectionsList scrollParent={`${uuid}-scrollable`} />
        </Stack>

        {/* Rendering a second copy of the active account button to make sure the scroller has enough space allocated */}
        <Box className="invisible">
          <ActiveAccountButton />
        </Box>
      </Stack>

      <Box className="absolute default-bg bottom-0 left-0 right-0 z-2">
        <ActiveAccountButton />
      </Box>
    </Stack>
  );
};
