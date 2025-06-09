import { ELSE, IF } from 'freedom-logical-web-components';
import React from 'react';
import { BC, useDerivedBinding } from 'react-bindings';

import { MailEditorProvider } from '../../../contexts/mail-editor.tsx';
import { useMailScreen } from '../../../contexts/mail-screen.tsx';
import { useSelectedMailThreadId } from '../../../contexts/selected-mail-thread-id.tsx';
import { useIsSizeClass } from '../../../hooks/useIsSizeClass.ts';
import { ComposeMailPanel } from './ComposeMailPanel.tsx';
import { SecondaryMailSidebar } from './SecondaryMailSidebar.tsx';
import { SelectedMailViewerPanel } from './SelectedMailViewerPanel.tsx';

export const MailDetailPanel = () => {
  const mailScreen = useMailScreen();
  const isLgOrLarger = useIsSizeClass('>=', 'lg');
  const selectedThreadId = useSelectedMailThreadId();

  const hasSelectedThreadId = useDerivedBinding(selectedThreadId, (threadId) => threadId !== undefined && threadId !== 'initial', {
    id: 'hasSelectedThreadId'
  });

  return BC(mailScreen.mode, (mode) => {
    switch (mode) {
      case undefined:
      case 'default':
        return IF(
          isLgOrLarger,
          () => <SelectedMailViewerPanel />,
          ELSE(() =>
            IF(
              hasSelectedThreadId,
              () => <SelectedMailViewerPanel />,
              ELSE(() => <SecondaryMailSidebar />)
            )
          )
        );
      case 'compose':
        return (
          <MailEditorProvider>
            <ComposeMailPanel />
          </MailEditorProvider>
        );
    }
  });
};
