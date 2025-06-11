import { Button } from '@mui/material';
import type { MailId } from 'freedom-email-api';
import { useT } from 'freedom-react-localization';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useMemo } from 'react';
import type { Binding } from 'react-bindings';
import { useBinding, useCallbackRef } from 'react-bindings';
import { useDerivedWaitable, type Waitable, type WrappedResult } from 'react-waitables';

import { $genericError, $tryAgain } from '../consts/common-strings.ts';
import { useIsBusy } from '../hooks/useIsBusy.tsx';
import { makeMailAddressListFromString } from '../utils/makeMailAddressListFromString.ts';
import { useActiveAccountInfo } from './active-account-info.tsx';
import { useMessagePresenter } from './message-presenter.tsx';
import { useSelectedMailThreadId } from './selected-mail-thread-id.tsx';
import { useSelectedMessageFolder } from './selected-message-folder.tsx';
import { useTasks } from './tasks.tsx';

export interface MailEditor {
  referencedMailId: Binding<MailId | undefined>;
  to: Binding<string>;
  cc: Binding<string>;
  showCc: Binding<boolean>;
  bcc: Binding<string>;
  showBcc: Binding<boolean>;
  subject: Binding<string>;
  body: Binding<string>;

  isFormReady: Waitable<boolean>;
  send: () => Promise<WrappedResult<{ mailId: MailId }, { errorCode: 'generic' | 'not-ready' }>>;
}

const MailEditorContext = createContext<MailEditor | undefined>(undefined);

export const MailEditorProvider = ({ children }: { children?: ReactNode }) => {
  const activeAccountInfo = useActiveAccountInfo();
  const isBusy = useIsBusy();
  const { presentErrorMessage } = useMessagePresenter();
  const selectedMessageFolder = useSelectedMessageFolder();
  const selectedThreadId = useSelectedMailThreadId();
  const t = useT();
  const tasks = useTasks();

  const referencedMailId = useBinding<MailId | undefined>(() => undefined, {
    id: 'defaultMailEditorReferencedMailId',
    detectChanges: true
  });
  const to = useBinding(() => '', { id: 'defaultMailEditorTo', detectChanges: true });
  const cc = useBinding(() => '', { id: 'defaultMailEditorCc', detectChanges: true });
  const showCc = useBinding(() => false, { id: 'defaultMailEditorShowCc', detectChanges: true });
  const bcc = useBinding(() => '', { id: 'defaultMailEditorBcc', detectChanges: true });
  const showBcc = useBinding(() => false, { id: 'defaultMailEditorShowBcc', detectChanges: true });
  const subject = useBinding(() => '', { id: 'defaultMailEditorSubject', detectChanges: true });
  const body = useBinding(() => '', { id: 'defaultMailEditorBody', detectChanges: true });

  // TODO: use real form validation
  const isFormReady = useDerivedWaitable(
    { isBusy, to, subject, body },
    ({ isBusy, to, subject, body }) => !isBusy && to.length > 0 && subject.length > 0 && body.length > 0,
    {
      id: 'isFormReady',
      limitType: 'none'
    }
  );

  const send = useCallbackRef(async (): Promise<WrappedResult<{ mailId: MailId }, { errorCode: 'generic' | 'not-ready' }>> => {
    const theActiveAccountInfo = activeAccountInfo.get();

    if (theActiveAccountInfo === undefined || tasks === undefined || !(isFormReady.value.get() ?? false)) {
      return { ok: false, value: { errorCode: 'not-ready' } };
    }

    return await isBusy.busyWhile(async () => {
      const sent = await tasks.sendMail({
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
      if (!sent.ok) {
        switch (sent.value.errorCode) {
          case 'generic':
            presentErrorMessage($genericError(t), {
              action: ({ dismissThen }) => (
                <Button color="error" onClick={dismissThen(send)}>
                  {$tryAgain(t)}
                </Button>
              )
            });
            return sent;
        }
      }

      // TODO: this is probably not great -- should really go back to whatever the history was before composing
      selectedMessageFolder.set('sent');
      selectedThreadId.set(sent.value.mailId);

      return sent;
    });
  });

  const mailEditor = useMemo<MailEditor>(
    () => ({ referencedMailId, to, cc, showCc, bcc, showBcc, subject, body, isBusy, isFormReady, send }),
    [bcc, body, cc, isBusy, isFormReady, referencedMailId, send, showBcc, showCc, subject, to]
  );

  return <MailEditorContext.Provider value={mailEditor}>{children}</MailEditorContext.Provider>;
};

export const useMailEditor = () => {
  const mailEditor = useContext(MailEditorContext);
  if (mailEditor === undefined) {
    throw new Error('useMailEditor must be used within a MailEditorProvider');
  }

  return mailEditor;
};
