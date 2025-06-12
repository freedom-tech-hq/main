import { ONE_SEC_MSEC } from 'freedom-basic-data';
import type { MailId } from 'freedom-email-api';
import { ANIMATION_DURATION_MSEC, MAX_SCROLL_DURATION_MSEC } from 'freedom-web-animation';
import { ResizeObservingDiv, useElementHeightBinding } from 'freedom-web-resize-observer';
import React from 'react';
import type { Binding } from 'react-bindings';
import { BC, useBinding, useBindingEffect, useCallbackRef } from 'react-bindings';

import { sp } from '../../../../components/bootstrapping/AppTheme.tsx';
import { ControlledTextField } from '../../../../components/reusable/form/ControlledTextField.tsx';
import { useMailEditor } from '../../../../contexts/mail-editor.tsx';
import { useMessagePresenter } from '../../../../contexts/message-presenter.tsx';
import { useScrollParentVisibleHeightPx } from '../../../../contexts/scroll-parent-info.tsx';
import { useIsSizeClass } from '../../../../hooks/useIsSizeClass.ts';
import { useUuid } from '../../../../hooks/useUuid.ts';
import type { MailTextStyle } from '../../../../types/MailTextStyle.ts';
import type { ReferencedMailCompositionMode } from '../../../../types/ReferencedMailCompositionMode.ts';
import { ComposeMailBottomToolbar } from './toolbars/ComposeMailBottomToolbar.tsx';
import { ComposeMailTopToolbar } from './toolbars/ComposeMailTopToolbar.tsx';

export interface ComposeMailBodyFieldProps {
  mode?: ReferencedMailCompositionMode;
  referencedMailId?: MailId;
  flexHeight: boolean;
  autoFocus?: boolean;
  hasFocus: Binding<boolean>;
  // TODO: remove this field and use MailEditor instead
  onDiscardClick: () => void;
}

export const ComposeMailBodyField = ({
  mode,
  referencedMailId,
  flexHeight,
  autoFocus,
  hasFocus,
  onDiscardClick
}: ComposeMailBodyFieldProps) => {
  const isMdOrLarger = useIsSizeClass('>=', 'md');
  const isSmOrSmaller = useIsSizeClass('<=', 'sm');
  const mailEditor = useMailEditor();
  const { presentErrorMessage } = useMessagePresenter();
  const scrollParentVisibleHeightPx = useScrollParentVisibleHeightPx();
  const uuid = useUuid();
  const viewportHeightPx = useElementHeightBinding(window.visualViewport ?? window);

  const onBodyFieldFocus = useCallbackRef(() => {
    hasFocus.set(true);

    const elem = document.getElementById(uuid);
    if (elem === null) {
      return; // Not ready
    }

    // Scroll to the top of the text area when it gets focus
    setTimeout(() => elem.scrollIntoView({ behavior: 'smooth', block: 'start' }), MAX_SCROLL_DURATION_MSEC);
  });
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
    { bodyTopToolbarHeightPx, bodyBottomToolbarHeightPx, isMdOrLarger, scrollParentVisibleHeightPx, viewportHeightPx },
    ({ bodyTopToolbarHeightPx, bodyBottomToolbarHeightPx, isMdOrLarger, scrollParentVisibleHeightPx, viewportHeightPx }) => {
      const textAreaElem = document.getElementById(`${uuid}-textarea`);
      if (textAreaElem === null) {
        return; // Not ready
      }

      textAreaElem.style.marginTop = `${bodyTopToolbarHeightPx}px`;
      textAreaElem.style.height = `calc(100% - ${bodyTopToolbarHeightPx}px - ${bodyBottomToolbarHeightPx}px)`;

      const minHeightPx = 60 + bodyTopToolbarHeightPx + bodyBottomToolbarHeightPx + 2;

      const containerHeightPx = Math.min(scrollParentVisibleHeightPx, viewportHeightPx);
      // On larger devices, we want to leave some margin around the input.  On smaller devices, we want to completely fill the available
      // space and hide the bottom border (-1 for bottom border height)
      const maxHeightPx = Math.max(minHeightPx, containerHeightPx - (isMdOrLarger ? sp(3) : -1));

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

  return BC(isSmOrSmaller, (isSmOrSmaller) => (
    <ControlledTextField
      id={`${uuid}-textarea`}
      value={mailEditor.body}
      autoFocus={autoFocus}
      multiline={true}
      helperText=""
      className={flexHeight ? 'flex-auto' : undefined}
      onFocus={onBodyFieldFocus}
      onBlur={onBodyFieldBlur}
      // If this isn't set, MUI manually overrides the height based on the lines of text
      rows={1}
      slotProps={{
        root: {
          id: uuid
        },
        input: {
          className: 'flex-auto',
          sx: {
            p: '2px',
            '& textarea:not([aria-hidden="true"])': {
              alignSelf: 'flex-start',
              boxSizing: 'border-box',
              padding: `${sp(1.5)}px ${sp(2)}px`,
              overflowY: 'auto'
            },
            '& fieldset': {
              transition: `border-radius ${ANIMATION_DURATION_MSEC / ONE_SEC_MSEC}s ease-in-out`
            },
            '&.Mui-focused fieldset': isSmOrSmaller ? { borderRadius: 0 } : {}
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
  ));
};
