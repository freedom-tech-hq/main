import { Button, Stack } from '@mui/material';
import { ONE_SEC_MSEC } from 'freedom-basic-data';
import { makeUuid } from 'freedom-contexts';
import { LOCALIZE } from 'freedom-localization';
import { ELSE, IF } from 'freedom-logical-web-components';
import { useT } from 'freedom-react-localization';
import { ANIMATION_DURATION_MSEC } from 'freedom-web-animation';
import { useHistory } from 'freedom-web-navigation';
import { useElementHeightBinding } from 'freedom-web-resize-observer';
import React, { useMemo } from 'react';
import { BC, useBinding, useBindingEffect, useCallbackRef, useDerivedBinding } from 'react-bindings';
import { useDerivedWaitable } from 'react-waitables';

import { sp } from '../../../components/bootstrapping/AppTheme.tsx';
import { Txt } from '../../../components/reusable/aliases/Txt.ts';
import { AppToolbar } from '../../../components/reusable/AppToolbar.tsx';
import { appRoot } from '../../../components/routing/appRoot.tsx';
import { $apiGenericError, $tryAgain } from '../../../consts/common-strings.ts';
import { useActiveAccountInfo } from '../../../contexts/active-account-info.tsx';
import { useMailEditor } from '../../../contexts/mail-editor.tsx';
import { useMessagePresenter } from '../../../contexts/message-presenter.tsx';
import { ScrollParentInfoProvider } from '../../../contexts/scroll-parent-info.tsx';
import { useSelectedMessageFolder } from '../../../contexts/selected-message-folder.tsx';
import { useTasks } from '../../../contexts/tasks.tsx';
import { useIsSizeClass } from '../../../hooks/useIsSizeClass.ts';
import { DraftIcon } from '../../../icons/DraftIcon.ts';
import { TrashIcon } from '../../../icons/TrashIcon.ts';
import { makeMailAddressListFromString } from '../../../utils/makeMailAddressListFromString.ts';
import { ComposeMailBodyField } from '../secondary-content/compose-mail/ComposeMailBodyField.tsx';
import { ComposeMailHeaderFields } from '../secondary-content/compose-mail/ComposeMailHeaderFields.tsx';

const ns = 'ui';
const $compose = LOCALIZE('Compose')({ ns });
const $discard = LOCALIZE('Discard')({ ns });
const $saveDraft = LOCALIZE('Save as Draft')({ ns });

export const ComposeMailPanel = () => {
  const activeAccountInfo = useActiveAccountInfo();
  const history = useHistory();
  const isLgOrLarger = useIsSizeClass('>=', 'lg');
  const isSmOrSmaller = useIsSizeClass('<=', 'sm');
  const { presentErrorMessage } = useMessagePresenter();
  const mailEditor = useMailEditor();
  const selectedMessageFolder = useSelectedMessageFolder();
  const t = useT();
  const tasks = useTasks();
  const uuid = useMemo(() => makeUuid(), []);

  const isBusyCount = useBinding(() => 0, { id: 'isBusyCount', detectChanges: true });
  const isBusy = useDerivedBinding(isBusyCount, (count) => count > 0, { id: 'isBusy', limitType: 'none' });

  const isFormReady = useDerivedWaitable({ isBusy }, ({ isBusy }) => !isBusy, { id: 'isFormReady', limitType: 'none' });

  const bodyFieldHasFocus = useBinding(() => false, { id: 'bodyFieldHasFocus', detectChanges: true });

  const onSaveDraftClick = useCallbackRef(async () => {
    const theActiveAccountInfo = activeAccountInfo.get();

    if (theActiveAccountInfo === undefined || tasks === undefined || !(isFormReady.value.get() ?? false)) {
      return;
    }

    isBusyCount.set(isBusyCount.get() + 1);
    try {
      const saved = await tasks.saveMailDraft(undefined, {
        from: makeMailAddressListFromString(theActiveAccountInfo.email),
        to: makeMailAddressListFromString(mailEditor.to.get()),
        cc: mailEditor.showCc.get() ? makeMailAddressListFromString(mailEditor.cc.get()) : [],
        bcc: mailEditor.showBcc.get() ? makeMailAddressListFromString(mailEditor.bcc.get()) : [],
        subject: mailEditor.subject.get(),
        isBodyHtml: false,
        body: mailEditor.body.get(),
        // TODO: should probably have a const for snippet length
        snippet: mailEditor.body.get().substring(0, 200)
      });
      if (!saved.ok) {
        switch (saved.value.errorCode) {
          case 'generic':
            presentErrorMessage($apiGenericError(t), {
              action: ({ dismissThen }) => (
                <Button color="error" onClick={dismissThen(onSaveDraftClick)}>
                  {$tryAgain(t)}
                </Button>
              )
            });
            return;
        }
      }

      // TODO: implement
      presentErrorMessage("This feature is not fully implemented yet.  Drafts can't be updated or sent.", {
        severity: 'error'
      });

      history.replace(appRoot.path.mail('drafts').thread(saved.value.mailId));
    } finally {
      isBusyCount.set(isBusyCount.get() - 1);
    }
  });

  const onDiscardClick = useCallbackRef(() => {
    // TODO: implement
    presentErrorMessage('This feature is not fully implemented yet.  Drafts are currently never deleted.', { severity: 'error' });

    history.replace(appRoot.path.mail(selectedMessageFolder.get() ?? 'all').value);
  });

  const scrollableHeightPx = useElementHeightBinding(`${uuid}-scrollable`);
  const topToolbarHeightPx = useElementHeightBinding(`${uuid}-top-toolbar`);
  const scrollParentVisibleHeightPx = useDerivedBinding(
    { scrollableHeightPx, topToolbarHeightPx },
    ({ scrollableHeightPx, topToolbarHeightPx }) => scrollableHeightPx - topToolbarHeightPx,
    { id: 'scrollParentVisibleHeightPx' }
  );

  useBindingEffect({ bodyFieldHasFocus, isLgOrLarger, isSmOrSmaller }, ({ bodyFieldHasFocus, isLgOrLarger, isSmOrSmaller }) => {
    const elem = document.getElementById(`${uuid}-compose-body-field-container`);
    if (elem === null) {
      return; // Not ready
    }

    elem.style.padding = `0 ${isLgOrLarger ? sp(3.5) : isSmOrSmaller && bodyFieldHasFocus ? 0 : sp(2)}px`;
  });

  return (
    <Stack alignItems="stretch" className="self-stretch flex-auto relative overflow-hidden">
      <ScrollParentInfoProvider insetTopPx={topToolbarHeightPx} heightPx={scrollableHeightPx} visibleHeightPx={scrollParentVisibleHeightPx}>
        <Stack id={`${uuid}-scrollable`} alignItems="stretch" className="relative flex-auto overflow-y-auto" sx={{ pb: 2 }}>
          {BC(isLgOrLarger, (isLgOrLarger) => (
            <Stack alignItems="stretch" sx={{ px: isLgOrLarger ? 2 : 0.5 }}>
              <AppToolbar id={`${uuid}-top-toolbar`} justifyContent="space-between" gap={2} className="sticky top-0 default-bg z-5">
                <Txt variant="h3" className="semibold">
                  {$compose(t)}
                </Txt>

                <Stack direction="row" alignItems="center" gap={1.5}>
                  <Button
                    title={$saveDraft(t)}
                    startIcon={<DraftIcon className="sm-icon" />}
                    onClick={onSaveDraftClick}
                    className="default-text"
                  >
                    {$saveDraft(t)}
                  </Button>

                  {IF(
                    isSmOrSmaller,
                    () => (
                      <Button color="error" title={$discard(t)} onClick={onDiscardClick}>
                        <TrashIcon color="error" className="sm-icon" />
                      </Button>
                    ),
                    ELSE(() => (
                      <Button
                        color="error"
                        title={$discard(t)}
                        startIcon={<TrashIcon color="error" className="sm-icon" />}
                        onClick={onDiscardClick}
                      >
                        {$discard(t)}
                      </Button>
                    ))
                  )}
                </Stack>
              </AppToolbar>
            </Stack>
          ))}
          <Stack alignItems="stretch" className="flex-auto" gap={2}>
            {BC(isLgOrLarger, (isLgOrLarger) => (
              <>
                <Stack alignItems="stretch" sx={{ px: isLgOrLarger ? 3.5 : 2 }}>
                  <ComposeMailHeaderFields />
                </Stack>
                <Stack
                  id={`${uuid}-compose-body-field-container`}
                  alignItems="stretch"
                  gap={2}
                  className="flex-auto"
                  style={{
                    transition: `padding ${ANIMATION_DURATION_MSEC / ONE_SEC_MSEC}s ease-in-out`,
                    padding: `0 ${isLgOrLarger ? sp(3.5) : isSmOrSmaller.get() && bodyFieldHasFocus.get() ? 0 : sp(2)}px`
                  }}
                >
                  <ComposeMailBodyField flexHeight={isLgOrLarger} hasFocus={bodyFieldHasFocus} onDiscardClick={onDiscardClick} />
                </Stack>
              </>
            ))}
          </Stack>
        </Stack>
      </ScrollParentInfoProvider>
    </Stack>
  );
};
