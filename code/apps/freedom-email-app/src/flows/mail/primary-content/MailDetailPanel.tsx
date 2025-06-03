import { ELSE, IF } from 'freedom-logical-web-components';
import React from 'react';
import { useDerivedBinding } from 'react-bindings';

import { useSelectedMailThreadId } from '../../../contexts/selected-mail-thread.tsx';
import { ComposeMailPanel } from './ComposeMailPanel.tsx';
import { SelectedMailViewerPanel } from './SelectedMailViewerPanel.tsx';

export const MailDetailPanel = () => {
  const selectedThread = useSelectedMailThreadId();

  const isInNewMailMode = useDerivedBinding(selectedThread, (threadId) => threadId === 'new-mail', { id: 'isInNewMailMode' });

  return IF(
    isInNewMailMode,
    () => <ComposeMailPanel />,
    ELSE(() => <SelectedMailViewerPanel />)
  );
};
