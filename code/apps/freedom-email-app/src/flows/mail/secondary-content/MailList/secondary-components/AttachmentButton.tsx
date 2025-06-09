import { Button, Stack, useTheme } from '@mui/material';
import type { MailAttachmentInfo } from 'freedom-email-api';
import React from 'react';
import { useCallbackRef } from 'react-bindings';

import { Txt } from '../../../../../components/reusable/aliases/Txt.ts';
import { IconPlaceholder } from '../../../../../components/reusable/IconPlaceholder.tsx';
import { TxtPlaceholder } from '../../../../../components/reusable/TxtPlaceholder.tsx';
import { useMessagePresenter } from '../../../../../contexts/message-presenter.tsx';
import { DownloadIcon } from '../../../../../icons/DownloadIcon.ts';
import { formatSizeBytes } from '../../../../../utils/formatSizeBytes.ts';

export interface AttachmentButtonProps {
  attachment: MailAttachmentInfo;
}

export const AttachmentButton = ({ attachment }: AttachmentButtonProps) => {
  const { presentErrorMessage } = useMessagePresenter();
  const theme = useTheme();

  const onClick = useCallbackRef(() => {
    // TODO: implement
    presentErrorMessage('This feature is not implemented yet.', { severity: 'error' });
  });

  // TODO: choose icon for mime type / preview
  return (
    <Button
      variant="outlined"
      className="input-border items-start"
      startIcon={<DownloadIcon width="20px" className="muted-text" />}
      onClick={onClick}
      sx={{ py: theme.spacing(1.5) }}
    >
      <Stack alignItems="flex-start">
        <Txt variant="body2" className="medium">
          {/* TODO: replace with filename */}
          {attachment.mimeType}
        </Txt>
        <Txt variant="body2" className="medium" color="textDisabled">
          {formatSizeBytes(attachment.sizeBytes)}
        </Txt>
      </Stack>
    </Button>
  );
};

export const AttachmentButtonPlaceholder = () => {
  const theme = useTheme();

  return (
    <Button
      variant="outlined"
      className="input-border items-start"
      startIcon={<IconPlaceholder width="20px" />}
      sx={{ py: theme.spacing(1.5) }}
    >
      <Stack alignItems="flex-start">
        <TxtPlaceholder variant="body2" className="medium">
          Example
        </TxtPlaceholder>
        <TxtPlaceholder variant="body2" className="medium">
          1.2MB
        </TxtPlaceholder>
      </Stack>
    </Button>
  );
};
