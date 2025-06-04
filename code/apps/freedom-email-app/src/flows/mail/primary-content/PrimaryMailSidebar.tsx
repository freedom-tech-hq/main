import { Box, Button, Stack } from '@mui/material';
import { makeUuid } from 'freedom-contexts';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import { useMemo } from 'react';

import { Txt } from '../../../components/reusable/aliases/Txt.tsx';
import { AppToolbar } from '../../../components/reusable/AppToolbar.tsx';
import { $appName } from '../../../consts/common-strings.ts';
import { primarySidebarWidthPx } from '../../../consts/sizes.ts';
import { CompanyLogoIcon } from '../../../icons/CompanyLogoIcon.ts';
import { NewEmailIcon } from '../../../icons/NewEmailIcon.ts';
import { MailCollectionsList } from '../secondary-content/MailCollectionsList/index.tsx';
import { ActiveAccountButton } from './ActiveAccountButton.tsx';

const ns = 'ui';
const $newEmail = LOCALIZE('New Email')({ ns });

export const PrimaryMailSidebar = () => {
  const t = useT();
  const uuid = useMemo(() => makeUuid(), []);

  return (
    <Stack alignItems="stretch" className="default-bg" sx={{ position: 'relative', width: `${primarySidebarWidthPx}px`, zIndex: 10 }}>
      <Stack alignItems="stretch" id={uuid} sx={{ overflowY: 'auto' }}>
        <AppToolbar>
          <CompanyLogoIcon color="primary" className="md-icon" />
          <Txt variant="body1">{$appName(t)}</Txt>
        </AppToolbar>

        <Button type="submit" variant="contained" startIcon={<NewEmailIcon className="primary-contrast sm-icon" />} sx={{ mx: 1.5, my: 1 }}>
          {$newEmail(t)}
        </Button>

        <Stack alignItems="stretch" sx={{ mx: 1.5, my: 1 }}>
          {/* TODO: handle onArrowLeft/right */}
          <MailCollectionsList scrollParent={uuid} />
        </Stack>

        {/* Rendering a second copy of the active account button to make sure the scroller has enough space allocated */}
        <Box sx={{ visibility: 'hidden' }}>
          <ActiveAccountButton />
        </Box>
      </Stack>

      {/* TODO: hook up onClick */}
      <Box className="blurred-overlay-bg" sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2 }}>
        <ActiveAccountButton />
      </Box>
    </Stack>
  );
};
