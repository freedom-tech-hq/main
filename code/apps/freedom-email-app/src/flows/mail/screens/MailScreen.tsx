import { Stack } from '@mui/material';
import type { ThreadLikeId } from 'freedom-email-user';
import { useHistory } from 'freedom-web-navigation';
import React, { useEffect } from 'react';
import { BC, useBindingEffect } from 'react-bindings';

import { appRoot } from '../../../components/routing/appRoot.tsx';
import type { MailScreenMode } from '../../../contexts/mail-screen-mode.tsx';
import { useMailScreenMode } from '../../../contexts/mail-screen-mode.tsx';
import { useSelectedMailThreadId } from '../../../contexts/selected-mail-thread-id.tsx';
import { useSizeClass } from '../../../hooks/useSizeClass.ts';
import { MailDetailPanel } from '../primary-content/MailDetailPanel.tsx';
import { MailSidebars } from '../primary-content/MailSidebars.tsx';

export interface MailScreenProps {
  mode?: MailScreenMode;
  threadId?: ThreadLikeId;
}

export const MailScreen = ({ mode, threadId }: MailScreenProps) => {
  const history = useHistory();
  const mailScreenMode = useMailScreenMode();
  const selectedThreadId = useSelectedMailThreadId();
  const sizeClass = useSizeClass();

  useEffect(() => {
    mailScreenMode.set(mode);

    switch (mode) {
      case undefined:
      case 'view-thread':
        if (selectedThreadId.get() !== 'initial' || threadId !== undefined) {
          selectedThreadId.set(threadId);
        }
        break;

      case 'compose':
        // threadId will always be undefined in compose mode, but we don't want to affect the selectedThreadId
        break;
    }
  }, [mailScreenMode, mode, selectedThreadId, threadId]);

  useBindingEffect(selectedThreadId, (selectedThreadId) => {
    if (selectedThreadId === undefined || selectedThreadId === 'initial') {
      history.replace(appRoot.path.mail.value);
    } else {
      history.replace(appRoot.path.mail.thread(selectedThreadId));
    }
  });

  return BC(sizeClass, (sizeClass) => {
    switch (sizeClass) {
      case 'xl':
      case 'lg':
      case 'md':
      case 'sm':
      case 'xs':
        // TODO: TEMP (md,sm,xs shouldnt be here)
        return (
          <Stack direction="row" alignItems="stretch" className="w-full h-dvh">
            <MailSidebars />
            <MailDetailPanel />
          </Stack>
        );

      //   case 'md':
      //     return (
      //       <Stack className="min-h-dvh">
      //         <AuthHeroBanner />
      //         <AuthPanel />
      //       </Stack>
      //     );

      //   case 'sm':
      //   case 'xs':
      //     return (
      //       <Stack className="min-h-dvh">
      //         <AuthPanel />
      //       </Stack>
      //     );
    }
  });
};
