import { Stack, useTheme } from '@mui/material';
import { makeUuid } from 'freedom-contexts';
import type { MailId } from 'freedom-email-api';
import { LOCALIZE } from 'freedom-localization';
import { IF } from 'freedom-logical-web-components';
import { ResizeObservingDiv } from 'freedom-web-resize-observer';
import { t } from 'i18next';
import React, { useMemo } from 'react';
import { useBinding, useBindingEffect, useCallbackRef } from 'react-bindings';

import { ControlledTextField } from '../../../../components/reusable/form/ControlledTextField.tsx';
import { useMessagePresenter } from '../../../../contexts/message-presenter.tsx';
import { useScrollParentVisibleHeightPx } from '../../../../contexts/scroll-parent-visible-height-px.tsx';
import type { MailTextStyle } from '../../../../types/MailTextStyle.ts';
import type { ReferencedMailCompositionMode } from '../../../../types/ReferencedMailCompositionMode.ts';
import { ComposeMailBccField } from './fields/ComposeMailBccField.tsx';
import { ComposeMailCcField } from './fields/ComposeMailCcField.tsx';
import { ComposeMailToField } from './fields/ComposeMailToField.tsx';
import { ComposeMailBottomToolbar } from './toolbars/ComposeMailBottomToolbar.tsx';
import { ComposeMailTopToolbar } from './toolbars/ComposeMailTopToolbar.tsx';

const ns = 'ui';
const $subject = LOCALIZE('Subject')({ ns });

export interface ComposeMailInputProps {
  mode?: ReferencedMailCompositionMode;
  referencedMailId?: MailId;
  onDiscardClick: () => void;
}

export const ComposeMailInput = ({ mode, referencedMailId, onDiscardClick }: ComposeMailInputProps) => {
  const { presentErrorMessage } = useMessagePresenter();
  const uuid = useMemo(() => makeUuid(), []);
  const scrollParentVisibleHeightPx = useScrollParentVisibleHeightPx();
  const theme = useTheme();

  const to = useBinding(() => '', { id: 'to', detectChanges: true });
  const cc = useBinding(() => '', { id: 'cc', detectChanges: true });
  const bcc = useBinding(() => '', { id: 'bcc', detectChanges: true });
  const subject = useBinding(() => '', { id: 'subject', detectChanges: true });
  const body = useBinding(() => '', { id: 'body', detectChanges: true });

  const showCc = useBinding(() => false, { id: 'showCc', detectChanges: true });
  const showBcc = useBinding(() => false, { id: 'showBcc', detectChanges: true });

  const textStyle = useBinding<MailTextStyle>(() => 'normal', { id: 'textStyle', detectChanges: true });

  const bodyTopToolbarHeightPx = useBinding<number>(() => (referencedMailId !== undefined ? 56 : 0), {
    id: 'bodyToolbarHeightPx',
    detectChanges: true
  });
  const onBodyTopToolbarResize = useCallbackRef((_width: number, height: number) => {
    if (height !== undefined) {
      bodyTopToolbarHeightPx.set(height);
    }
  });

  const bodyBottomToolbarHeightPx = useBinding(() => 60, { id: 'bodyToolbarHeightPx', detectChanges: true });
  const onBodyBottomToolbarResize = useCallbackRef((_width: number, height: number) => {
    if (height !== undefined) {
      bodyBottomToolbarHeightPx.set(height);
    }
  });

  useBindingEffect(
    { bodyTopToolbarHeightPx, bodyBottomToolbarHeightPx, scrollParentVisibleHeightPx },
    ({ bodyTopToolbarHeightPx, bodyBottomToolbarHeightPx, scrollParentVisibleHeightPx }) => {
      const textAreaElem = document.getElementById(`${uuid}-body`);
      if (textAreaElem === null) {
        return; // Not ready
      }

      textAreaElem.style.marginTop = `${bodyTopToolbarHeightPx}px`;
      textAreaElem.style.height = `calc(100% - ${bodyTopToolbarHeightPx}px - ${bodyBottomToolbarHeightPx}px)`;

      const muiInputElem = textAreaElem.parentElement!;
      muiInputElem.style.minHeight =
        referencedMailId === undefined
          ? `calc(60px + ${bodyTopToolbarHeightPx}px + ${bodyBottomToolbarHeightPx}px + 2px)`
          : `calc(${scrollParentVisibleHeightPx}px - ${theme.spacing(3)})`;
    },
    { triggerOnMount: true }
  );

  const onAttachFilesClick = useCallbackRef(() => {
    // TODO: implement
    presentErrorMessage('This feature is not implemented yet.', { severity: 'error' });
  });

  const onBoldClick = useCallbackRef(() => {
    // TODO: implement
    presentErrorMessage('This feature is not implemented yet.', { severity: 'error' });
  });

  const onItalicClick = useCallbackRef(() => {
    // TODO: implement
    presentErrorMessage('This feature is not implemented yet.', { severity: 'error' });
  });

  const onUnderlineClick = useCallbackRef(() => {
    // TODO: implement
    presentErrorMessage('This feature is not implemented yet.', { severity: 'error' });
  });

  const onStrikeClick = useCallbackRef(() => {
    // TODO: implement
    presentErrorMessage('This feature is not implemented yet.', { severity: 'error' });
  });

  const onLeftAlignClick = useCallbackRef(() => {
    // TODO: implement
    presentErrorMessage('This feature is not implemented yet.', { severity: 'error' });
  });

  const onCenterClick = useCallbackRef(() => {
    // TODO: implement
    presentErrorMessage('This feature is not implemented yet.', { severity: 'error' });
  });

  const onRightAlignClick = useCallbackRef(() => {
    // TODO: implement
    presentErrorMessage('This feature is not implemented yet.', { severity: 'error' });
  });

  const onInsertLinkClick = useCallbackRef(() => {
    // TODO: implement
    presentErrorMessage('This feature is not implemented yet.', { severity: 'error' });
  });

  const onNumberedListClick = useCallbackRef(() => {
    // TODO: implement
    presentErrorMessage('This feature is not implemented yet.', { severity: 'error' });
  });

  const onBulletedListClick = useCallbackRef(() => {
    // TODO: implement
    presentErrorMessage('This feature is not implemented yet.', { severity: 'error' });
  });

  return (
    <Stack className="flex-auto" gap={2}>
      {IF(referencedMailId === undefined, () => (
        <>
          <ComposeMailToField value={to} showCc={showCc} showBcc={showBcc} />

          {IF(showCc, () => (
            <ComposeMailCcField value={cc} showBcc={showBcc} />
          ))}

          {IF(showBcc, () => (
            <ComposeMailBccField value={bcc} />
          ))}

          <ControlledTextField value={subject} label={$subject(t)} labelPosition="above" helperText="" />
        </>
      ))}

      <ControlledTextField
        id={`${uuid}-body`}
        value={body}
        multiline={true}
        helperText=""
        className="flex-auto"
        // If this isn't set, MUI manually overrides the height based on the lines of text
        rows={1}
        slotProps={{
          input: {
            className: 'flex-auto',
            sx: {
              p: '2px',
              '& textarea:not([aria-hidden="true"])': {
                alignSelf: 'flex-start',
                boxSizing: 'border-box',
                padding: '12px 16px',
                overflowY: 'auto'
              }
            },
            startAdornment: (
              <>
                {referencedMailId !== undefined ? (
                  <ResizeObservingDiv
                    id={`${uuid}-body-top-toolbar`}
                    tag={0}
                    onResize={onBodyTopToolbarResize}
                    className="absolute top-0 left-0 right-0"
                  >
                    <ComposeMailTopToolbar defaultMode={mode ?? 'reply'} referencedMailId={referencedMailId} />
                  </ResizeObservingDiv>
                ) : null}

                <ResizeObservingDiv
                  id={`${uuid}-body-bottom-toolbar`}
                  tag={0}
                  onResize={onBodyBottomToolbarResize}
                  className="absolute bottom-0 left-0 right-0"
                >
                  <ComposeMailBottomToolbar
                    textStyle={textStyle}
                    showDiscardButton={referencedMailId !== undefined}
                    onAttachFilesClick={onAttachFilesClick}
                    onBoldClick={onBoldClick}
                    onItalicClick={onItalicClick}
                    onUnderlineClick={onUnderlineClick}
                    onStrikeClick={onStrikeClick}
                    onLeftAlignClick={onLeftAlignClick}
                    onCenterClick={onCenterClick}
                    onRightAlignClick={onRightAlignClick}
                    onInsertLinkClick={onInsertLinkClick}
                    onNumberedListClick={onNumberedListClick}
                    onBulletedListClick={onBulletedListClick}
                    onDiscardClick={onDiscardClick}
                  />
                </ResizeObservingDiv>
              </>
            )
          }
        }}
      />
    </Stack>
  );
};
