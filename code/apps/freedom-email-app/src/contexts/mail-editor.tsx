import type { MailId } from 'freedom-email-api';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useMemo } from 'react';
import { type Binding, makeBinding, useBinding } from 'react-bindings';

export interface MailEditor {
  referencedMailId: Binding<MailId | undefined>;
  to: Binding<string>;
  cc: Binding<string>;
  showCc: Binding<boolean>;
  bcc: Binding<string>;
  showBcc: Binding<boolean>;
  subject: Binding<string>;
  body: Binding<string>;
}

const MailEditorContext = createContext<MailEditor>({
  referencedMailId: makeBinding(() => undefined, { id: 'defaultMailEditorReferencedMailId', detectChanges: true }),
  to: makeBinding(() => '', { id: 'defaultMailEditorTo', detectChanges: true }),
  cc: makeBinding(() => '', { id: 'defaultMailEditorCc', detectChanges: true }),
  showCc: makeBinding(() => false, { id: 'defaultMailEditorShowCc', detectChanges: true }),
  bcc: makeBinding(() => '', { id: 'defaultMailEditorBcc', detectChanges: true }),
  showBcc: makeBinding(() => false, { id: 'defaultMailEditorShowBcc', detectChanges: true }),
  subject: makeBinding(() => '', { id: 'defaultMailEditorSubject', detectChanges: true }),
  body: makeBinding(() => '', { id: 'defaultMailEditorBody', detectChanges: true })
});

export const MailEditorProvider = ({ children }: { children?: ReactNode }) => {
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

  const mailEditor = useMemo<MailEditor>(
    () => ({ referencedMailId, to, cc, showCc, bcc, showBcc, subject, body }),
    [bcc, body, cc, referencedMailId, showBcc, showCc, subject, to]
  );

  return <MailEditorContext.Provider value={mailEditor}>{children}</MailEditorContext.Provider>;
};

export const useMailEditor = () => useContext(MailEditorContext);
