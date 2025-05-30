import { Stack } from '@mui/material';

import { PrimaryMailSidebar } from './PrimaryMailSidebar.tsx';
import { SecondaryMailSidebar } from './SecondaryMailSidebar.tsx';

export const MailSidebars = () => {
  return (
    <Stack direction="row" alignItems="stretch" className="h-dvh">
      <PrimaryMailSidebar />
      <SecondaryMailSidebar />
    </Stack>
  );
};
