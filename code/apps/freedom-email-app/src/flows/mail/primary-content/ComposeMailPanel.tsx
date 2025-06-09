import { Button, Stack } from '@mui/material';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import { useHistory } from 'freedom-web-navigation';
import React from 'react';
import { useBinding, useCallbackRef, useDerivedBinding } from 'react-bindings';
import { useDerivedWaitable } from 'react-waitables';

import { Txt } from '../../../components/reusable/aliases/Txt.ts';
import { AppToolbar } from '../../../components/reusable/AppToolbar.tsx';
import { appRoot } from '../../../components/routing/appRoot.tsx';
import { $apiGenericError, $tryAgain } from '../../../consts/common-strings.ts';
import { useActiveAccountInfo } from '../../../contexts/active-account-info.tsx';
import { useMailEditor } from '../../../contexts/mail-editor.tsx';
import { useMessagePresenter } from '../../../contexts/message-presenter.tsx';
import { useSelectedMessageFolder } from '../../../contexts/selected-message-folder.tsx';
import { useTasks } from '../../../contexts/tasks.tsx';
import { DraftIcon } from '../../../icons/DraftIcon.ts';
import { TrashIcon } from '../../../icons/TrashIcon.ts';
import { makeMailAddressListFromString } from '../../../utils/makeMailAddressListFromString.ts';
import { ComposeMailInput } from '../secondary-content/ComposeMailInput/index.tsx';

const ns = 'ui';
const $compose = LOCALIZE('Compose')({ ns });
const $discard = LOCALIZE('Discard')({ ns });
const $saveDraft = LOCALIZE('Save as Draft')({ ns });

export const ComposeMailPanel = () => {
  const activeAccountInfo = useActiveAccountInfo();
  const history = useHistory();
  const { presentErrorMessage } = useMessagePresenter();
  const mailEditor = useMailEditor();
  const selectedMessageFolder = useSelectedMessageFolder();
  const t = useT();
  const tasks = useTasks();

  const isBusyCount = useBinding(() => 0, { id: 'isBusyCount', detectChanges: true });
  const isBusy = useDerivedBinding(isBusyCount, (count) => count > 0, { id: 'isBusy', limitType: 'none' });

  const isFormReady = useDerivedWaitable({ isBusy }, ({ isBusy }) => !isBusy, { id: 'isFormReady', limitType: 'none' });

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

  return (
    <Stack alignItems="stretch" className="self-stretch flex-auto relative overflow-hidden">
      <Stack alignItems="stretch" className="relative flex-auto overflow-y-auto" sx={{ px: 2, pb: 2 }}>
        <AppToolbar justifyContent="space-between" gap={2} className="sticky top-0 default-bg z-5">
          <Txt variant="h3" className="semibold">
            {$compose(t)}
          </Txt>

          <Stack direction="row" alignItems="center" gap={1.5}>
            <Button title={$saveDraft(t)} startIcon={<DraftIcon className="sm-icon" />} onClick={onSaveDraftClick} className="default-text">
              {$saveDraft(t)}
            </Button>

            <Button color="error" title={$discard(t)} startIcon={<TrashIcon color="error" className="sm-icon" />} onClick={onDiscardClick}>
              {$discard(t)}
            </Button>
          </Stack>
        </AppToolbar>
        <Stack className="flex-auto" sx={{ px: 1.5 }}>
          <ComposeMailInput onDiscardClick={onDiscardClick} />
        </Stack>
      </Stack>
    </Stack>
  );
};
