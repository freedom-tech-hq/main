import { makeUuid } from 'freedom-contexts';
import type { MailId } from 'freedom-email-api';
import { ResizeObservingDiv, useElementHeightBinding } from 'freedom-web-resize-observer';
import React, { useMemo } from 'react';
import type { Binding } from 'react-bindings';
import { useBinding, useBindingEffect, useCallbackRef } from 'react-bindings';

import { sp } from '../../../../components/bootstrapping/AppTheme.tsx';
import { ControlledTextField } from '../../../../components/reusable/form/ControlledTextField.tsx';
import { useMailEditor } from '../../../../contexts/mail-editor.tsx';
import { useMessagePresenter } from '../../../../contexts/message-presenter.tsx';
import { useScrollParentVisibleHeightPx } from '../../../../contexts/scroll-parent-info.tsx';
import type { MailTextStyle } from '../../../../types/MailTextStyle.ts';
import type { ReferencedMailCompositionMode } from '../../../../types/ReferencedMailCompositionMode.ts';
import { ComposeMailBottomToolbar } from './toolbars/ComposeMailBottomToolbar.tsx';
import { ComposeMailTopToolbar } from './toolbars/ComposeMailTopToolbar.tsx';

export interface ComposeMailBodyFieldProps {
  mode?: ReferencedMailCompositionMode;
  referencedMailId?: MailId;
  flexHeight: boolean;
  hasFocus: Binding<boolean>;
  // TODO: remove this field and use MailEditor instead
  onDiscardClick: () => void;
}

export const ComposeMailBodyField = ({ mode, referencedMailId, flexHeight, hasFocus, onDiscardClick }: ComposeMailBodyFieldProps) => {
  const mailEditor = useMailEditor();
  const { presentErrorMessage } = useMessagePresenter();
  const scrollParentVisibleHeightPx = useScrollParentVisibleHeightPx();
  const uuid = useMemo(() => makeUuid(), []);
  const viewportHeightPx = useElementHeightBinding(window.visualViewport ?? window);

  const onBodyFieldFocus = useCallbackRef(() => hasFocus.set(true));
  const onBodyFieldBlur = useCallbackRef(() => hasFocus.set(false));

  const textStyle = useBinding<MailTextStyle>(() => 'normal', { id: 'textStyle', detectChanges: true });

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
    { bodyTopToolbarHeightPx, bodyBottomToolbarHeightPx, scrollParentVisibleHeightPx, viewportHeightPx },
    ({ bodyTopToolbarHeightPx, bodyBottomToolbarHeightPx, scrollParentVisibleHeightPx, viewportHeightPx }) => {
      const textAreaElem = document.getElementById(uuid);
      if (textAreaElem === null) {
        return; // Not ready
      }

      textAreaElem.style.marginTop = `${bodyTopToolbarHeightPx}px`;
      textAreaElem.style.height = `calc(100% - ${bodyTopToolbarHeightPx}px - ${bodyBottomToolbarHeightPx}px)`;

      const minHeightPx = 60 + bodyTopToolbarHeightPx + bodyBottomToolbarHeightPx + 2;

      const containerHeightPx = Math.min(scrollParentVisibleHeightPx, viewportHeightPx);
      const maxHeightPx = Math.max(minHeightPx, containerHeightPx - sp(3));

      const muiInputElem = textAreaElem.parentElement!;
      muiInputElem.style.minHeight = `${minHeightPx}px`;
      muiInputElem.style.maxHeight = `${maxHeightPx}px`;
      muiInputElem.style.height = flexHeight ? 'auto' : `${maxHeightPx}px`;
    },
    { triggerOnMount: true }
  );

  const topToolbar =
    referencedMailId !== undefined ? (
      <ResizeObservingDiv
        id={`${uuid}-body-top-toolbar`}
        tag={0}
        onResize={onBodyTopToolbarResize}
        className="absolute top-0 left-0 right-0"
      >
        <ComposeMailTopToolbar defaultMode={mode ?? 'reply'} referencedMailId={referencedMailId} />
      </ResizeObservingDiv>
    ) : null;

  const bottomToolbar = (
    <ResizeObservingDiv
      id={`${uuid}-body-bottom-toolbar`}
      tag={0}
      onResize={onBodyBottomToolbarResize}
      className="absolute bottom-0 left-0 right-0"
    >
      <ComposeMailBottomToolbar
        isFormReady={mailEditor.isFormReady}
        textStyle={textStyle}
        showDiscardButton={referencedMailId !== undefined}
        onAttachFilesClick={onAttachFilesClick}
        onBoldClick={onBoldClick}
        onBulletedListClick={onBulletedListClick}
        onDiscardClick={onDiscardClick}
        onInsertLinkClick={onInsertLinkClick}
        onItalicClick={onItalicClick}
        onNumberedListClick={onNumberedListClick}
        onSendClick={mailEditor.send}
        onStrikeClick={onStrikeClick}
        onUnderlineClick={onUnderlineClick}
      />
    </ResizeObservingDiv>
  );

  return (
    <ControlledTextField
      id={uuid}
      value={mailEditor.body}
      multiline={true}
      helperText=""
      className={flexHeight ? 'flex-auto' : undefined}
      onFocus={onBodyFieldFocus}
      onBlur={onBodyFieldBlur}
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
              padding: `${sp(1.5)}px ${sp(2)}px`,
              overflowY: 'auto'
            }
          },
          startAdornment: (
            <>
              {topToolbar}
              {bottomToolbar}
            </>
          )
        }
      }}
    />
  );
};
