import React from 'react';
import { BC } from 'react-bindings';

import { useMailScreenMode } from '../../../contexts/mail-screen-mode.tsx';
import { ComposeMailPanel } from './ComposeMailPanel.tsx';
import { SelectedMailViewerPanel } from './SelectedMailViewerPanel.tsx';

export const MailDetailPanel = () => {
  const mailScreenMode = useMailScreenMode();

  return BC(mailScreenMode, (mode) => {
    switch (mode) {
      case undefined:
      case 'view-thread':
        return <SelectedMailViewerPanel />;
      case 'compose':
        return <ComposeMailPanel />;
    }
  });
};
