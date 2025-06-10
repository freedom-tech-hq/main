import { Button, Stack } from '@mui/material';
import { ONE_SEC_MSEC } from 'freedom-basic-data';
import { makeUuid } from 'freedom-contexts';
import type { MailId } from 'freedom-email-api';
import { LOCALIZE } from 'freedom-localization';
import { ELSE, IF } from 'freedom-logical-web-components';
import { useT } from 'freedom-react-localization';
import { ANIMATION_DURATION_MSEC } from 'freedom-web-animation';
import { useElementHeightBinding } from 'freedom-web-resize-observer';
import React, { useMemo, useRef } from 'react';
import { BC, useBinding, useBindingEffect, useCallbackRef, useDerivedBinding } from 'react-bindings';

import { sp } from '../../../components/bootstrapping/AppTheme.tsx';
import { Txt } from '../../../components/reusable/aliases/Txt.ts';
import { AppToolbar } from '../../../components/reusable/AppToolbar.tsx';
import { OnFirstMount } from '../../../components/reusable/OnFirstMount.tsx';
import { INPUT_DEBOUNCE_TIME_MSEC } from '../../../consts/timing.ts';
import { MailEditorProvider } from '../../../contexts/mail-editor.tsx';
import { useMailScreen } from '../../../contexts/mail-screen.tsx';
import { useMessagePresenter } from '../../../contexts/message-presenter.tsx';
import { ScrollParentInfoProvider } from '../../../contexts/scroll-parent-info.tsx';
import { useSelectedMailThreadId } from '../../../contexts/selected-mail-thread-id.tsx';
import { useSelectedMessageFolder } from '../../../contexts/selected-message-folder.tsx';
import { useIsSizeClass } from '../../../hooks/useIsSizeClass.ts';
import { ArchiveIcon } from '../../../icons/ArchiveIcon.ts';
import { ForwardIcon } from '../../../icons/ForwardIcon.ts';
import { HamburgerMenuIcon } from '../../../icons/HamburgerMenuIcon.ts';
import { MarkUnreadIcon } from '../../../icons/MarkUnreadIcon.ts';
import { MoreActionsIcon } from '../../../icons/MoreActionsIcon.ts';
import { NavBackIcon } from '../../../icons/NavBackIcon.ts';
import { ReplyAllIcon } from '../../../icons/ReplyAllIcon.ts';
import { ReplyIcon } from '../../../icons/ReplyIcon.ts';
import { SpamIcon } from '../../../icons/SpamIcon.ts';
import { TrashIcon } from '../../../icons/TrashIcon.ts';
import type { ReferencedMailCompositionMode } from '../../../types/ReferencedMailCompositionMode.ts';
import { ComposeMailBodyField } from '../secondary-content/compose-mail/ComposeMailBodyField.tsx';
import { MailList } from '../secondary-content/MailList/index.tsx';
import type { MailListControls } from '../secondary-content/MailList/MailListControls.ts';

const ns = 'ui';
const $archive = LOCALIZE('Archive')({ ns });
const $backToMailbox = LOCALIZE('Back to Mailbox')({ ns });
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
  const mailScreen = useMailScreen();
  const uuid = useMemo(() => makeUuid(), []);
  const isLgOrSmaller = useIsSizeClass('<=', 'lg');
  const isMdOrLarger = useIsSizeClass('>=', 'md');
  const isMdOrSmaller = useIsSizeClass('<=', 'md');
  const isSmOrSmaller = useIsSizeClass('<=', 'sm');

  const selectedMessageFolder = useSelectedMessageFolder();
  const hasSelectedMessageFolder = useDerivedBinding(selectedMessageFolder, (folder) => folder !== undefined, {
    id: 'hasSelectedMessageFolder'
  });

  const selectedThreadId = useSelectedMailThreadId();
  const hasSelectedThreadId = useDerivedBinding(selectedThreadId, (id) => id !== undefined, { id: 'hasSelectedThreadId' });

  const needsHamburgerMenu = useDerivedBinding(
    { isLgOrSmaller, hasSelectedMessageFolder },
    ({ isLgOrSmaller, hasSelectedMessageFolder }) => isLgOrSmaller && !hasSelectedMessageFolder,
    { id: 'needsHamburgerMenu' }
  );

  const mailListControls = useRef<MailListControls>({});

  const composition = useBinding<{ mode: ReferencedMailCompositionMode; referencedMailId: MailId } | undefined>(() => undefined, {
    id: 'composition'
  });
  const isInCompositionMode = useDerivedBinding(composition, (mode) => mode !== undefined, { id: 'isInCompositionMode' });
  const clearCompositionMode = useCallbackRef(() => composition.set(undefined));

  const bodyFieldHasFocus = useBinding(() => false, { id: 'bodyFieldHasFocus', detectChanges: true });

  useBindingEffect(selectedThreadId, () => {
    composition.set(undefined);
  });

  const onHamburgerMenuClick = useCallbackRef(() => {
    mailScreen.showPrimarySidebar.set(true);
  });

  const onBackClick = useCallbackRef(() => {
    selectedThreadId.set(undefined);
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

  useBindingEffect({ bodyFieldHasFocus, isSmOrSmaller }, ({ bodyFieldHasFocus, isSmOrSmaller }) => {
    const elem = document.getElementById(`${uuid}-compose-mail-input`);
    if (elem === null) {
      return; // Not ready
    }

    elem.style.padding = `0 ${isSmOrSmaller && bodyFieldHasFocus ? 0 : sp(2)}px`;
  });

  const scrollableHeightPx = useElementHeightBinding(`${uuid}-scrollable`);
  const topToolbarHeightPx = useElementHeightBinding(`${uuid}-top-toolbar`);
  const scrollParentVisibleHeightPx = useDerivedBinding(
    { scrollableHeightPx, topToolbarHeightPx },
    ({ scrollableHeightPx, topToolbarHeightPx }) => scrollableHeightPx - topToolbarHeightPx,
    { id: 'scrollParentVisibleHeightPx' }
  );

  return (
    <Stack alignItems="stretch" className="flex-auto relative overflow-hidden">
      <ScrollParentInfoProvider insetTopPx={topToolbarHeightPx} heightPx={scrollableHeightPx} visibleHeightPx={scrollParentVisibleHeightPx}>
        <Stack id={`${uuid}-scrollable`} alignItems="stretch" className="relative flex-auto overflow-y-auto">
          {IF(
            hasSelectedThreadId,
            () => (
              <>
                <AppToolbar
                  id={`${uuid}-top-toolbar`}
                  justifyContent="space-between"
                  gap={2}
                  className="sticky top-0 default-bg z-5"
                  sx={{ px: 2 }}
                >
                  <Stack direction="row" alignItems="center" gap={2}>
                    {IF(needsHamburgerMenu, () => (
                      <Button variant="outlined" sx={{ p: 1 }} className="input-border">
                        <HamburgerMenuIcon className="sm-icon default-text" onClick={onHamburgerMenuClick} />
                      </Button>
                    ))}

                    {IF(isMdOrSmaller, () => (
                      <Button sx={{ p: 1 }} title={$backToMailbox(t)} onClick={onBackClick}>
                        <NavBackIcon className="sm-icon secondary-text" />
                      </Button>
                    ))}

                    <Button sx={{ p: 1 }} title={$archive(t)} onClick={onArchiveClick}>
                      <ArchiveIcon className="sm-icon secondary-text" />
                    </Button>

                    <Button sx={{ p: 1 }} title={$spam(t)} onClick={onSpamClick}>
                      <SpamIcon className="sm-icon secondary-text" />
                    </Button>

                    <Button sx={{ p: 1 }} title={$trash(t)} onClick={onTrashClick}>
                      <TrashIcon className="sm-icon secondary-text" />
                    </Button>

                    {IF(isMdOrLarger, () => (
                      <>
                        <Button sx={{ p: 1 }} title={$reply(t)} onClick={onReplyClick}>
                          <ReplyIcon className="sm-icon secondary-text" />
                        </Button>

                        <Button sx={{ p: 1 }} title={$replyAll(t)} onClick={onReplyAllClick}>
                          <ReplyAllIcon className="sm-icon secondary-text" />
                        </Button>

                        <Button sx={{ p: 1 }} title={$forward(t)} onClick={onForwardClick}>
                          <ForwardIcon className="sm-icon secondary-text" />
                        </Button>
                      </>
                    ))}

                    <Button sx={{ p: 1 }} title={$markUnread(t)} onClick={onMarkUnreadClick}>
                      <MarkUnreadIcon className="sm-icon secondary-text" />
                    </Button>
                  </Stack>

                  <Button sx={{ p: 1 }} title={$moreActions(t)} onClick={onMoreActionsClick}>
                    <MoreActionsIcon className="sm-icon secondary-text" />
                  </Button>
                </AppToolbar>

                <Stack sx={{ px: 2 }}>
                  <MailList scrollParent={`${uuid}-scrollable`} controls={mailListControls.current} />
                </Stack>

                {IF(
                  isInCompositionMode,
                  () => (
                    <Stack
                      id={`${uuid}-compose-mail-input`}
                      sx={{ mb: 1.5 }}
                      style={{
                        transition: `padding ${ANIMATION_DURATION_MSEC / ONE_SEC_MSEC}s ease-in-out`,
                        padding: `0 ${isSmOrSmaller.get() && bodyFieldHasFocus.get() ? 0 : sp(2)}px`
                      }}
                    >
                      <MailEditorProvider>
                        {BC(composition, (composition) => (
                          <ComposeMailBodyField
                            mode={composition?.mode}
                            referencedMailId={composition?.referencedMailId}
                            flexHeight={false}
                            autoFocus
                            hasFocus={bodyFieldHasFocus}
                            onDiscardClick={clearCompositionMode}
                          />
                        ))}
                      </MailEditorProvider>
                      <OnFirstMount do={scrollToComposeMailInput} delayMSec={INPUT_DEBOUNCE_TIME_MSEC} />
                    </Stack>
                  ),
                  ELSE(() =>
                    BC(isSmOrSmaller, (isSmOrSmaller) => (
                      <Stack direction="row" gap={2} sx={{ pl: isSmOrSmaller ? 2 : 8, pr: 2, mb: 1.5 }}>
                        <Button variant="contained" color="secondary" startIcon={<ReplyIcon className="sm-icon" />} onClick={onReplyClick}>
                          {$reply(t)}
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
                  )
                )}
              </>
            ),
            ELSE(() => (
              <>
                {IF(needsHamburgerMenu, () => (
                  <AppToolbar
                    id={`${uuid}-top-toolbar`}
                    justifyContent="space-between"
                    gap={2}
                    className="sticky top-0 default-bg z-5"
                    sx={{ px: 2 }}
                  >
                    <Button variant="outlined" sx={{ p: 1 }} className="input-border">
                      <HamburgerMenuIcon className="sm-icon default-text" onClick={onHamburgerMenuClick} />
                    </Button>
                  </AppToolbar>
                ))}
                <Stack justifyContent="center" alignItems="center" gap={1} className="flex-auto" sx={{ px: 2 }}>
                  <Txt variant="h3" color="textDisabled" className="semibold text-center">
                    {$noThreadSelectedTitle(t)}
                  </Txt>
                  <Txt variant="body1" color="textDisabled" className="semibold text-center">
                    {$noThreadSelectedInstructions(t)}
                  </Txt>
                </Stack>
              </>
            ))
          )}
        </Stack>
      </ScrollParentInfoProvider>
    </Stack>
  );
};
