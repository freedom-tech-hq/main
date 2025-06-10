import { Stack } from '@mui/material';
import type { MailThreadLikeId } from 'freedom-email-api';
import type { LocalizableStringResolver } from 'freedom-localization';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import { useHistory } from 'freedom-web-navigation';
import React, { useEffect } from 'react';
import { BC, useBindingEffect } from 'react-bindings';

import { appRoot } from '../../../components/routing/appRoot.tsx';
import { $appName } from '../../../consts/common-strings.ts';
import type { MailScreenMode } from '../../../contexts/mail-screen.tsx';
import { useMailScreen } from '../../../contexts/mail-screen.tsx';
import { useSelectedMailThreadId } from '../../../contexts/selected-mail-thread-id.tsx';
import { useSelectedMessageFolder } from '../../../contexts/selected-message-folder.tsx';
import { MailDetailPanel } from '../primary-content/MailDetailPanel.tsx';
import { MailSidebars } from '../primary-content/MailSidebars.tsx';

const ns = 'ui';
const $subtitlesByMailScreenMode: Record<MailScreenMode, LocalizableStringResolver> = {
  compose: LOCALIZE(' – Compose')({ ns }),
  default: LOCALIZE('')({ ns })
};

export interface MailScreenProps {
  mode?: MailScreenMode;
  threadId?: MailThreadLikeId;
}

export const MailScreen = ({ mode, threadId }: MailScreenProps) => {
  const history = useHistory();
  const mailScreen = useMailScreen();
  const selectedThreadId = useSelectedMailThreadId();
  const selectedMessageFolder = useSelectedMessageFolder();
  const t = useT();

  useEffect(() => {
    mailScreen.mode.set(mode);

    switch (mode) {
      case undefined:
      case 'default':
        if (selectedThreadId.get() !== 'initial' || threadId !== undefined) {
          selectedThreadId.set(threadId);
        }
        break;

      case 'compose':
        // threadId will always be undefined in compose mode, but we don't want to affect the selectedThreadId
        break;
    }
  }, [mailScreen, mode, selectedThreadId, threadId]);

  useBindingEffect(selectedMessageFolder, (selectedMessageFolder) => {
    const theSelectedThreadId = selectedThreadId.get();
    if (theSelectedThreadId !== undefined && theSelectedThreadId !== 'initial') {
      history.replace(appRoot.path.mail(selectedMessageFolder ?? 'all').thread(theSelectedThreadId));
    } else {
      history.replace(appRoot.path.mail(selectedMessageFolder ?? 'all').value);
    }
  });

  useBindingEffect(selectedThreadId, (selectedThreadId) => {
    if (selectedThreadId === undefined || selectedThreadId === 'initial') {
      history.replace(appRoot.path.mail(selectedMessageFolder.get() ?? 'all').value);
    } else {
      history.replace(appRoot.path.mail(selectedMessageFolder.get() ?? 'all').thread(selectedThreadId));
    }
  });

  return (
    <>
      {BC(mailScreen, ({ mode }) => (
        <title>{`${$appName(t)}${mode !== undefined ? $subtitlesByMailScreenMode[mode](t) : ''}`}</title>
      ))}

      <Stack direction="row" alignItems="stretch" className="w-full h-dvh">
        <MailSidebars />
        <Stack direction="column" alignItems="stretch" className="flex-auto overflow-hidden">
          <MailDetailPanel />
        </Stack>
      </Stack>
    </>
  );
};
