import { ReplyAllOutlined as ReplyAllIcon, ReplyOutlined as ReplyIcon, ShortcutOutlined as ForwardIcon } from '@mui/icons-material';
import { Button, Stack } from '@mui/material';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';

import { ActionMenuDivider } from './ActionMenuDivider.tsx';

const ns = 'ui';
const $replyButtonTitle = LOCALIZE('Reply')({ ns });
const $replyAllButtonTitle = LOCALIZE('Reply All')({ ns });
const $forwardButtonTitle = LOCALIZE('Forward')({ ns });

export const MailThreadActionsMenu = () => {
  const t = useT();

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
          {$replyButtonTitle(t)}
        </Button>
        <ActionMenuDivider />
        <Button variant="text" size="small" startIcon={<ReplyAllIcon />}>
          {$replyAllButtonTitle(t)}
        </Button>
        <ActionMenuDivider />
        <Button variant="text" size="small" startIcon={<ForwardIcon />}>
          {$forwardButtonTitle(t)}
        </Button>
      </Stack>
    </Stack>
  );
};
