import { ReplyAllOutlined as ReplyAllIcon, ReplyOutlined as ReplyIcon, ShortcutOutlined as ForwardIcon } from '@mui/icons-material';
import type { SxProps, Theme } from '@mui/material';
import { Button, Stack, useTheme } from '@mui/material';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';

import { ActionMenuDivider } from './ActionMenuDivider.tsx';

const ns = 'ui';
const $replyButtonTitle = LOCALIZE('Reply')({ ns });
const $replyAllButtonTitle = LOCALIZE('Reply All')({ ns });
const $forwardButtonTitle = LOCALIZE('Forward')({ ns });

export const MailActionsMenu = () => (
  <>
    <InternalMailActionsMenu isShadowVersion={true} />
    <InternalMailActionsMenu isShadowVersion={false} />
  </>
);

// Helpers

const buttonStyle: SxProps<Theme> = { borderRadius: 0 };

const InternalMailActionsMenu = ({ isShadowVersion }: { isShadowVersion: boolean }) => {
  const t = useT();
  const theme = useTheme();

  return (
    <Stack
      alignItems="center"
      sx={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: -19,
        zIndex: isShadowVersion ? -1 : 1
      }}
    >
      <Stack
        direction="row"
        alignItems="stretch"
        sx={{
          width: 'auto',
          borderRadius: theme.shape.borderRadius,
          backgroundColor: theme.palette.background.paper,
          boxShadow: isShadowVersion ? theme.shadows[4] : undefined,
          overflow: 'hidden'
        }}
      >
        <Button variant="text" size="small" sx={buttonStyle} title={$replyButtonTitle(t)}>
          <ReplyIcon />
        </Button>
        <ActionMenuDivider />
        <Button variant="text" size="small" sx={buttonStyle} title={$replyAllButtonTitle(t)}>
          <ReplyAllIcon />
        </Button>
        <ActionMenuDivider />
        <Button variant="text" size="small" sx={buttonStyle} title={$forwardButtonTitle(t)}>
          <ForwardIcon />
        </Button>
      </Stack>
    </Stack>
  );
};
