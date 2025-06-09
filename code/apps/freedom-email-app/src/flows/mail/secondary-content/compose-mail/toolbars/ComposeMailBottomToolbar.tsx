import { Button, Stack } from '@mui/material';
import { LOCALIZE } from 'freedom-localization';
import { IF } from 'freedom-logical-web-components';
import { useT } from 'freedom-react-localization';
import React from 'react';
import { BC, type Binding, useBinding } from 'react-bindings';
import type { Waitable } from 'react-waitables';

import { TextAlignmentButtonGroup } from '../../../../../components/reusable/form/TextAlignmentButtonGroup.tsx';
import { AttachmentIcon } from '../../../../../icons/AttachmentIcon.ts';
import { BoldIcon } from '../../../../../icons/BoldIcon.ts';
import { BulletedListIcon } from '../../../../../icons/BulletedListIcon.ts';
import { ItalicIcon } from '../../../../../icons/ItalicIcon.ts';
import { LinkIcon } from '../../../../../icons/LinkIcon.ts';
import { NumberedListIcon } from '../../../../../icons/NumberedListIcon.ts';
import { SentIcon } from '../../../../../icons/SentIcon.ts';
import { StrikeIcon } from '../../../../../icons/StrikeIcon.ts';
import { TrashIcon } from '../../../../../icons/TrashIcon.ts';
import { UnderlineIcon } from '../../../../../icons/UnderlineIcon.ts';
import type { MailTextStyle } from '../../../../../types/MailTextStyle.ts';
import { MailTextStylesPopupButton } from '../MailTextStylesPopupButton.tsx';

const ns = 'ui';
const $attachFiles = LOCALIZE('Attach Files')({ ns });
const $bold = LOCALIZE('Bold')({ ns });
const $bulletedList = LOCALIZE('Bulleted List')({ ns });
const $discard = LOCALIZE('Discard')({ ns });
const $insertLink = LOCALIZE('Insert Link')({ ns });
const $italic = LOCALIZE('Italic')({ ns });
const $numberedList = LOCALIZE('Numbered List')({ ns });
const $send = LOCALIZE('Send')({ ns });
const $strike = LOCALIZE('Strike')({ ns });
const $underline = LOCALIZE('Underline')({ ns });

export interface ComposeMailBottomToolbarProps {
  isFormReady: Waitable<boolean>;
  textStyle: Binding<MailTextStyle>;
  showDiscardButton: boolean;

  onAttachFilesClick: () => void;
  onBoldClick: () => void;
  onBulletedListClick?: () => void;
  onDiscardClick?: () => void;
  onInsertLinkClick?: () => void;
  onItalicClick: () => void;
  onNumberedListClick?: () => void;
  onSendClick?: () => void;
  onStrikeClick: () => void;
  onUnderlineClick: () => void;
}

export const ComposeMailBottomToolbar = ({
  isFormReady,
  textStyle,
  showDiscardButton,
  onAttachFilesClick,
  onBoldClick,
  onBulletedListClick,
  onDiscardClick,
  onInsertLinkClick,
  onItalicClick,
  onNumberedListClick,
  onSendClick,
  onStrikeClick,
  onUnderlineClick
}: ComposeMailBottomToolbarProps) => {
  const t = useT();

  const sendButton = BC(isFormReady.value, (isFormReady = false) => (
    <Button variant="contained" startIcon={<SentIcon className="sm-icon primary-contrast" />} disabled={!isFormReady} onClick={onSendClick}>
      {$send(t)}
    </Button>
  ));

  const attachmentButton = (
    <Button sx={{ p: 1 }} title={$attachFiles(t)} onClick={onAttachFilesClick}>
      <AttachmentIcon className="sm-icon secondary-text" />
    </Button>
  );

  // TODO: TEMP
  const textAlign = useBinding<'left' | 'center' | 'right'>(() => 'left', { id: 'textAlign', detectChanges: true });

  return (
    <Stack alignItems="stretch" gap={1} className="overflow-x-auto" sx={{ px: 2, py: 1.5 }}>
      <Stack direction="row" alignItems="center" columnGap={4} rowGap={1}>
        <Stack direction="row" alignItems="center" gap={1}>
          {sendButton}
          {attachmentButton}
        </Stack>

        <MailTextStylesPopupButton textStyle={textStyle} />

        <Stack direction="row" alignItems="center" gap={1}>
          <Button sx={{ p: 1 }} title={$bold(t)} onClick={onBoldClick}>
            <BoldIcon className="sm-icon secondary-text" />
          </Button>

          <Button sx={{ p: 1 }} title={$italic(t)} onClick={onItalicClick}>
            <ItalicIcon className="sm-icon secondary-text" />
          </Button>

          <Button sx={{ p: 1 }} title={$underline(t)} onClick={onUnderlineClick}>
            <UnderlineIcon className="sm-icon secondary-text" />
          </Button>

          <Button sx={{ p: 1 }} title={$strike(t)} onClick={onStrikeClick}>
            <StrikeIcon className="sm-icon secondary-text" />
          </Button>
        </Stack>

        <Stack direction="row" alignItems="center" columnGap={4} rowGap={1}>
          <TextAlignmentButtonGroup value={textAlign} />

          <Stack direction="row" alignItems="center" columnGap={4} rowGap={1}>
            <Stack direction="row" alignItems="center" gap={1}>
              <Button sx={{ p: 1 }} title={$insertLink(t)} onClick={onInsertLinkClick}>
                <LinkIcon className="sm-icon secondary-text" />
              </Button>

              <Button sx={{ p: 1 }} title={$numberedList(t)} onClick={onNumberedListClick}>
                <NumberedListIcon className="sm-icon secondary-text" />
              </Button>

              <Button sx={{ p: 1 }} title={$bulletedList(t)} onClick={onBulletedListClick}>
                <BulletedListIcon className="sm-icon secondary-text" />
              </Button>
            </Stack>
          </Stack>
        </Stack>

        {IF(showDiscardButton, () => (
          <Stack direction="row" justifyContent="flex-end" alignItems="center" className="flex-auto">
            <Button sx={{ p: 1 }} title={$discard(t)} onClick={onDiscardClick}>
              <TrashIcon color="error" className="sm-icon " />
            </Button>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
};
