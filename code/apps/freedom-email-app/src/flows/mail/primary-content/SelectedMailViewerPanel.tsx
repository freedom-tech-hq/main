import { Button, Stack } from '@mui/material';
import { makeUuid } from 'freedom-contexts';
import type { MailId } from 'freedom-email-api';
import { LOCALIZE } from 'freedom-localization';
import { ELSE, IF } from 'freedom-logical-web-components';
import { useT } from 'freedom-react-localization';
import { useElementResizeObserver } from 'freedom-web-resize-observer';
import React, { useMemo, useRef } from 'react';
import { BC, useBinding, useBindingEffect, useCallbackRef, useDerivedBinding } from 'react-bindings';

import { Txt } from '../../../components/reusable/aliases/Txt.ts';
import { AppToolbar } from '../../../components/reusable/AppToolbar.tsx';
import { OnFirstMount } from '../../../components/reusable/OnFirstMount.tsx';
import { INPUT_DEBOUNCE_TIME_MSEC } from '../../../consts/timing.ts';
import { useMessagePresenter } from '../../../contexts/message-presenter.tsx';
import { ScrollParentVisibleHeightPxProvider } from '../../../contexts/scroll-parent-visible-height-px.tsx';
import { useSelectedMailThreadId } from '../../../contexts/selected-mail-thread-id.tsx';
import { ArchiveIcon } from '../../../icons/ArchiveIcon.ts';
import { ForwardIcon } from '../../../icons/ForwardIcon.ts';
import { MarkUnreadIcon } from '../../../icons/MarkUnreadIcon.ts';
import { MoreActionsIcon } from '../../../icons/MoreActionsIcon.ts';
import { ReplyAllIcon } from '../../../icons/ReplyAllIcon.ts';
import { ReplyIcon } from '../../../icons/ReplyIcon.ts';
import { SpamIcon } from '../../../icons/SpamIcon.ts';
import { TrashIcon } from '../../../icons/TrashIcon.ts';
import type { ReferencedMailCompositionMode } from '../../../types/ReferencedMailCompositionMode.ts';
import { ComposeMailInput } from '../secondary-content/ComposeMailInput/index.tsx';
import { MailList } from '../secondary-content/MailList/index.tsx';
import type { MailListControls } from '../secondary-content/MailList/MailListControls.ts';

const ns = 'ui';
const $archive = LOCALIZE('Archive')({ ns });
const $forward = LOCALIZE('Forward')({ ns });
const $markUnread = LOCALIZE('Mark as Unread')({ ns });
const $moreActions = LOCALIZE('More Actions…')({ ns });
const $noThreadSelectedTitle = LOCALIZE('No Conversation Selected')({ ns });
const $noThreadSelectedInstructions = LOCALIZE('Select a conversation to read')({ ns });
const $reply = LOCALIZE('Reply')({ ns });
const $replyAll = LOCALIZE('Reply All')({ ns });
const $spam = LOCALIZE('Spam')({ ns });
const $trash = LOCALIZE('Trash')({ ns });

export const SelectedMailViewerPanel = () => {
  const { presentErrorMessage } = useMessagePresenter();
  const t = useT();
  const uuid = useMemo(() => makeUuid(), []);

  const selectedThreadId = useSelectedMailThreadId();
  const hasSelectedThreadId = useDerivedBinding(selectedThreadId, (id) => id !== undefined, { id: 'hasSelectedThreadId' });

  const mailListControls = useRef<MailListControls>({});

  const composition = useBinding<{ mode: ReferencedMailCompositionMode; referencedMailId: MailId } | undefined>(() => undefined, {
    id: 'composition'
  });
  const isInCompositionMode = useDerivedBinding(composition, (mode) => mode !== undefined, { id: 'isInCompositionMode' });
  const clearCompositionMode = useCallbackRef(() => composition.set(undefined));

  useBindingEffect(selectedThreadId, () => {
    composition.set(undefined);
  });

  const onArchiveClick = useCallbackRef(() => {
    // TODO: implement
    presentErrorMessage('This feature is not implemented yet.', { severity: 'error' });
  });

  const onForwardClick = useCallbackRef(() => {
    const referencedMailId = mailListControls.current.getMostRecentMailId?.();
    if (referencedMailId === undefined) {
      return; // Not ready
    }

    composition.set({ mode: 'forward', referencedMailId });
    scrollToComposeMailInput();
  });

  const onMoreActionsClick = useCallbackRef(() => {
    // TODO: implement
    presentErrorMessage('This feature is not implemented yet.', { severity: 'error' });
  });

  const onMarkUnreadClick = useCallbackRef(() => {
    // TODO: implement
    presentErrorMessage('This feature is not implemented yet.', { severity: 'error' });
  });

  const onReplyClick = useCallbackRef(() => {
    const referencedMailId = mailListControls.current.getMostRecentMailId?.();
    if (referencedMailId === undefined) {
      return; // Not ready
    }

    composition.set({ mode: 'reply', referencedMailId });
    scrollToComposeMailInput();
  });

  const onReplyAllClick = useCallbackRef(() => {
    const referencedMailId = mailListControls.current.getMostRecentMailId?.();
    if (referencedMailId === undefined) {
      return; // Not ready
    }

    composition.set({ mode: 'reply-all', referencedMailId });
    scrollToComposeMailInput();
  });

  const onSpamClick = useCallbackRef(() => {
    // TODO: implement
    presentErrorMessage('This feature is not implemented yet.', { severity: 'error' });
  });

  const onTrashClick = useCallbackRef(() => {
    // TODO: implement
    presentErrorMessage('This feature is not implemented yet.', { severity: 'error' });
  });

  const scrollToComposeMailInput = useCallbackRef(() => {
    const inputElem = document.getElementById(`${uuid}-compose-mail-input`);
    if (inputElem !== null) {
      inputElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  const scrollableHeightPx = useBinding(() => 800, { id: 'scrollableHeightPx', detectChanges: true });
  useElementResizeObserver({
    element: `${uuid}-scrollable`,
    tag: 0,
    onResize: (_width, height) => {
      scrollableHeightPx.set(height);
    }
  });

  const topToolbarHeightPx = useBinding(() => 56, { id: 'topToolbarHeightPx', detectChanges: true });
  useElementResizeObserver({
    element: `${uuid}-top-toolbar`,
    tag: 0,
    onResize: (_width, height) => {
      topToolbarHeightPx.set(height);
    }
  });

  const scrollParentVisibleHeightPx = useDerivedBinding(
    { scrollableHeightPx, topToolbarHeightPx },
    ({ scrollableHeightPx, topToolbarHeightPx }) => scrollableHeightPx - topToolbarHeightPx,
    { id: 'scrollParentVisibleHeightPx' }
  );

  return (
    <Stack alignItems="stretch" className="self-stretch flex-auto relative overflow-hidden">
      <ScrollParentVisibleHeightPxProvider value={scrollParentVisibleHeightPx}>
        <Stack id={`${uuid}-scrollable`} alignItems="stretch" className="relative flex-auto overflow-y-auto">
          {IF(
            hasSelectedThreadId,
            () => (
              <>
                <AppToolbar id={`${uuid}-top-toolbar`} justifyContent="space-between" gap={2} className="sticky top-0 default-bg z-5">
                  <Stack direction="row" alignItems="center" gap={2}>
                    <Button sx={{ p: 1 }} title={$archive(t)} onClick={onArchiveClick}>
                      <ArchiveIcon className="sm-icon secondary-text" />
                    </Button>

                    <Button sx={{ p: 1 }} title={$spam(t)} onClick={onSpamClick}>
                      <SpamIcon className="sm-icon secondary-text" />
                    </Button>

                    <Button sx={{ p: 1 }} title={$trash(t)} onClick={onTrashClick}>
                      <TrashIcon className="sm-icon secondary-text" />
                    </Button>

                    <Button sx={{ p: 1 }} title={$reply(t)} onClick={onReplyClick}>
                      <ReplyIcon className="sm-icon secondary-text" />
                    </Button>

                    <Button sx={{ p: 1 }} title={$replyAll(t)} onClick={onReplyAllClick}>
                      <ReplyAllIcon className="sm-icon secondary-text" />
                    </Button>

                    <Button sx={{ p: 1 }} title={$forward(t)} onClick={onForwardClick}>
                      <ForwardIcon className="sm-icon secondary-text" />
                    </Button>

                    <Button sx={{ p: 1 }} title={$markUnread(t)} onClick={onMarkUnreadClick}>
                      <MarkUnreadIcon className="sm-icon secondary-text" />
                    </Button>
                  </Stack>

                  <Button sx={{ p: 1 }} title={$moreActions(t)} onClick={onMoreActionsClick}>
                    <MoreActionsIcon className="sm-icon secondary-text" />
                  </Button>
                </AppToolbar>

                <Stack sx={{ px: 1.5 }}>
                  <MailList scrollParent={`${uuid}-scrollable`} controls={mailListControls.current} />
                  {IF(
                    isInCompositionMode,
                    () => (
                      <Stack id={`${uuid}-compose-mail-input`} sx={{ mb: 1.5 }}>
                        {BC(composition, (composition) => (
                          <ComposeMailInput
                            mode={composition?.mode}
                            referencedMailId={composition?.referencedMailId}
                            onDiscardClick={clearCompositionMode}
                          />
                        ))}
                        <OnFirstMount do={scrollToComposeMailInput} delayMSec={INPUT_DEBOUNCE_TIME_MSEC} />
                      </Stack>
                    ),
                    ELSE(() => (
                      <Stack direction="row" gap={2} sx={{ pl: 6, mb: 1.5 }}>
                        <Button variant="contained" color="secondary" startIcon={<ReplyIcon className="sm-icon" />} onClick={onReplyClick}>
                          {$reply(t)}
                        </Button>
                        <Button
                          variant="contained"
                          color="secondary"
                          startIcon={<ReplyAllIcon className="sm-icon" />}
                          onClick={onReplyAllClick}
                        >
                          {$replyAll(t)}
                        </Button>
                        <Button
                          variant="contained"
                          color="secondary"
                          startIcon={<ForwardIcon className="sm-icon" />}
                          onClick={onForwardClick}
                        >
                          {$forward(t)}
                        </Button>
                      </Stack>
                    ))
                  )}
                </Stack>
              </>
            ),
            ELSE(() => (
              <Stack justifyContent="center" alignItems="center" gap={1} className="flex-auto" sx={{ px: 1.5 }}>
                <Txt variant="h3" color="textDisabled" className="semibold text-center">
                  {$noThreadSelectedTitle(t)}
                </Txt>
                <Txt variant="body1" color="textDisabled" className="semibold text-center">
                  {$noThreadSelectedInstructions(t)}
                </Txt>
              </Stack>
            ))
          )}
        </Stack>
      </ScrollParentVisibleHeightPxProvider>
    </Stack>
  );
};
