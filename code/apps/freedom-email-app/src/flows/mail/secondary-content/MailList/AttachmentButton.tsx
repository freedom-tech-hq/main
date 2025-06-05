import { Button, Stack } from '@mui/material';
import type { MailAttachmentInfo } from 'freedom-email-sync';
import React from 'react';

import { Txt } from '../../../../components/reusable/aliases/Txt.ts';
import { IconPlaceholder } from '../../../../components/reusable/IconPlaceholder.tsx';
import { TxtPlaceholder } from '../../../../components/reusable/TxtPlaceholder.tsx';
import { DownloadIcon } from '../../../../icons/DownloadIcon.ts';
import { formatSizeBytes } from '../../../../utils/formatSizeBytes.ts';

export interface AttachmentButtonProps {
  attachment: MailAttachmentInfo;
}

export const AttachmentButton = ({ attachment }: AttachmentButtonProps) => {
  // TODO: choose icon for mime type / preview
  return (
    <Button variant="outlined" className="AttachmentButton" startIcon={<DownloadIcon color="disabled" width="20px" />}>
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

export const AttachmentButtonPlaceholder = () => (
  <Button variant="outlined" className="AttachmentButton" startIcon={<IconPlaceholder width="20px" />} disabled>
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
