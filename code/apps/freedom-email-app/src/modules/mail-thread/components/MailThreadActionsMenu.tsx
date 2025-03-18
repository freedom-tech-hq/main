import { ReplyAllOutlined as ReplyAllIcon, ReplyOutlined as ReplyIcon, ShortcutOutlined as ForwardIcon } from '@mui/icons-material';
import { Button, Stack } from '@mui/material';

import { ActionMenuDivider } from './ActionMenuDivider.tsx';

export const MailThreadActionsMenu = () => {
  return (
    <Stack alignItems="center" sx={{ left: 0, right: 0 }}>
      <Stack
        direction="row"
        alignItems="stretch"
        gap={2}
        sx={{
          width: 'auto'
        }}
      >
        <Button variant="text" size="small" startIcon={<ReplyIcon />}>
          Reply
        </Button>
        <ActionMenuDivider />
        <Button variant="text" size="small" startIcon={<ReplyAllIcon />}>
          Reply All
        </Button>
        <ActionMenuDivider />
        <Button variant="text" size="small" startIcon={<ForwardIcon />}>
          Forward
        </Button>
      </Stack>
    </Stack>
  );
};
