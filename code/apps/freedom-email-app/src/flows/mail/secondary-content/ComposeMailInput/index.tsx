import { Button, Stack, useTheme } from '@mui/material';
import { makeUuid } from 'freedom-contexts';
import type { MailId } from 'freedom-email-api';
import { LOCALIZE } from 'freedom-localization';
import { IF } from 'freedom-logical-web-components';
import { ResizeObservingDiv } from 'freedom-web-resize-observer';
import { t } from 'i18next';
import React, { useMemo } from 'react';
import { useBinding, useBindingEffect, useCallbackRef, useDerivedBinding } from 'react-bindings';
import { useDerivedWaitable } from 'react-waitables';

import { ControlledTextField } from '../../../../components/reusable/form/ControlledTextField.tsx';
import { $apiGenericError, $tryAgain } from '../../../../consts/common-strings.ts';
import { useActiveAccountInfo } from '../../../../contexts/active-account-info.tsx';
import { useMessagePresenter } from '../../../../contexts/message-presenter.tsx';
import { useScrollParentVisibleHeightPx } from '../../../../contexts/scroll-parent-info.tsx';
import { useSelectedMailThreadId } from '../../../../contexts/selected-mail-thread-id.tsx';
import { useSelectedMessageFolder } from '../../../../contexts/selected-message-folder.tsx';
import { useTasks } from '../../../../contexts/tasks.tsx';
import type { MailTextStyle } from '../../../../types/MailTextStyle.ts';
import type { ReferencedMailCompositionMode } from '../../../../types/ReferencedMailCompositionMode.ts';
import { makeMailAddressListFromString } from '../../../../utils/makeMailAddressListFromString.ts';
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
  const activeAccountInfo = useActiveAccountInfo();
  const { presentErrorMessage } = useMessagePresenter();
  const uuid = useMemo(() => makeUuid(), []);
  const scrollParentVisibleHeightPx = useScrollParentVisibleHeightPx();
  const selectedMessageFolder = useSelectedMessageFolder();
  const selectedThreadId = useSelectedMailThreadId();
  const tasks = useTasks();
  const theme = useTheme();

  const to = useBinding(() => '', { id: 'to', detectChanges: true });
  const cc = useBinding(() => '', { id: 'cc', detectChanges: true });
  const bcc = useBinding(() => '', { id: 'bcc', detectChanges: true });
  const subject = useBinding(() => '', { id: 'subject', detectChanges: true });
  const body = useBinding(() => '', { id: 'body', detectChanges: true });

  const showCc = useBinding(() => false, { id: 'showCc', detectChanges: true });
  const showBcc = useBinding(() => false, { id: 'showBcc', detectChanges: true });

  const textStyle = useBinding<MailTextStyle>(() => 'normal', { id: 'textStyle', detectChanges: true });

  const isBusyCount = useBinding(() => 0, { id: 'isBusyCount', detectChanges: true });
  const isBusy = useDerivedBinding(isBusyCount, (count) => count > 0, { id: 'isBusy', limitType: 'none' });

  // TODO: use real form validation
  const isFormReady = useDerivedWaitable(
    { isBusy, to, subject, body },
    ({ isBusy, to, subject, body }) => !isBusy && to.length > 0 && subject.length > 0 && body.length > 0,
    {
      id: 'isFormReady',
      limitType: 'none'
    }
  );

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

  const onSendClick = useCallbackRef(async () => {
    const theActiveAccountInfo = activeAccountInfo.get();

    if (theActiveAccountInfo === undefined || tasks === undefined || !(isFormReady.value.get() ?? false)) {
      return;
    }

    isBusyCount.set(isBusyCount.get() + 1);
    try {
      const sent = await tasks.sendMail({
        from: makeMailAddressListFromString(theActiveAccountInfo.email),
        to: makeMailAddressListFromString(to.get()),
        cc: showCc.get() ? makeMailAddressListFromString(cc.get()) : [],
        bcc: showBcc.get() ? makeMailAddressListFromString(bcc.get()) : [],
        subject: subject.get(),
        isBodyHtml: false,
        body: body.get(),
        // TODO: should probably have a const for snippet length
        snippet: body.get().substring(0, 200)
      });
      if (!sent.ok) {
        switch (sent.value.errorCode) {
          case 'generic':
            presentErrorMessage($apiGenericError(t), {
              action: ({ dismissThen }) => (
                <Button color="error" onClick={dismissThen(onSendClick)}>
                  {$tryAgain(t)}
                </Button>
              )
            });
            return;
        }
      }

      // TODO: this is probably not great -- should really go back to whatever the history was before composing
      selectedMessageFolder.set('sent');
      selectedThreadId.set(sent.value.mailId);
    } finally {
      isBusyCount.set(isBusyCount.get() - 1);
    }
  });

  return (
    <Stack className="flex-auto" gap={2}>
      {IF(referencedMailId === undefined, () => (
        <>
          <ComposeMailToField autoFocus value={to} showCc={showCc} showBcc={showBcc} />

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
                    <ComposeMailTopToolbar
                      defaultMode={mode ?? 'reply'}
                      referencedMailId={referencedMailId}
                      to={to}
                      cc={cc}
                      showCc={showCc}
                      bcc={bcc}
                      showBcc={showBcc}
                      subject={subject}
                    />
                  </ResizeObservingDiv>
                ) : null}

                <ResizeObservingDiv
                  id={`${uuid}-body-bottom-toolbar`}
                  tag={0}
                  onResize={onBodyBottomToolbarResize}
                  className="absolute bottom-0 left-0 right-0"
                >
                  <ComposeMailBottomToolbar
                    isFormReady={isFormReady}
                    textStyle={textStyle}
                    showDiscardButton={referencedMailId !== undefined}
                    onAttachFilesClick={onAttachFilesClick}
                    onBoldClick={onBoldClick}
                    onBulletedListClick={onBulletedListClick}
                    onCenterClick={onCenterClick}
                    onDiscardClick={onDiscardClick}
                    onInsertLinkClick={onInsertLinkClick}
                    onItalicClick={onItalicClick}
                    onLeftAlignClick={onLeftAlignClick}
                    onNumberedListClick={onNumberedListClick}
                    onRightAlignClick={onRightAlignClick}
                    onSendClick={onSendClick}
                    onStrikeClick={onStrikeClick}
                    onUnderlineClick={onUnderlineClick}
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
