import { Stack } from '@mui/material';
import type { MailId } from 'freedom-email-api';
import { IF } from 'freedom-logical-web-components';
import React, { useRef } from 'react';
import { useBinding, useBindingEffect } from 'react-bindings';

import { useMailEditor } from '../../../../../contexts/mail-editor.tsx';
import { useTaskWaitable } from '../../../../../hooks/useTaskWaitable.ts';
import type { ReferencedMailCompositionMode } from '../../../../../types/ReferencedMailCompositionMode.ts';
import { makeStringFromMailAddressList } from '../../../../../utils/makeStringFromMailAddressList.ts';
import { ComposeMailBccField } from '../fields/ComposeMailBccField.tsx';
import { ComposeMailCcField } from '../fields/ComposeMailCcField.tsx';
import { ComposeMailToField } from '../fields/ComposeMailToField.tsx';
import { ReferencedMailCompositionModePopupButton } from '../ReferencedMailCompositionModePopupButton.tsx';

export interface ComposeMailTopToolbarProps {
  defaultMode: ReferencedMailCompositionMode;
  referencedMailId: MailId;
}

export const ComposeMailTopToolbar = ({ defaultMode, referencedMailId }: ComposeMailTopToolbarProps) => {
  const mailEditor = useMailEditor();

  const referencedMail = useTaskWaitable((tasks) => tasks.getMail(undefined, referencedMailId), { id: 'referencedMail' });
  // TODO: populate the hidden inReplyTo field as well

  const mode = useBinding<ReferencedMailCompositionMode>(() => defaultMode, { id: 'mode', detectChanges: true });
  const lastDefaultMode = useRef(defaultMode);
  if (lastDefaultMode.current !== defaultMode) {
    lastDefaultMode.current = defaultMode;
    mode.set(defaultMode);
  }

  useBindingEffect(
    { mode, referencedMail: referencedMail.value },
    ({ mode, referencedMail }) => {
      if (referencedMail === undefined) {
        return;
      }

      switch (mode) {
        case 'forward':
          mailEditor.to.set('');
          mailEditor.cc.set('');
          break;
        case 'reply':
          mailEditor.to.set(makeStringFromMailAddressList(referencedMail.from));
          mailEditor.cc.set('');
          break;
        case 'reply-all':
          mailEditor.to.set(makeStringFromMailAddressList(referencedMail.from));
          mailEditor.cc.set(makeStringFromMailAddressList([...referencedMail.to, ...referencedMail.cc]));
          break;
      }
    },
    { triggerOnMount: 'first' }
  );

  useBindingEffect(
    referencedMail.value,
    (referencedMail) => {
      if (referencedMail === undefined) {
        return;
      }

      mailEditor.subject.set(referencedMail.subject);
    },
    { triggerOnMount: 'first' }
  );

  return (
    <Stack direction="row" justifyContent="flex-start" alignItems="baseline" gap={1} sx={{ px: 1, py: 1.5 }}>
      <ReferencedMailCompositionModePopupButton mode={mode} />
      <Stack sx={{ flex: 1 }}>
        <ComposeMailToField
          value={mailEditor.to}
          showCc={mailEditor.showCc}
          showBcc={mailEditor.showBcc}
          variant="standard"
          labelPosition="before"
          slotProps={{ input: { disableUnderline: true } }}
        />

        {IF(mailEditor.showCc, () => (
          <ComposeMailCcField
            value={mailEditor.cc}
            showBcc={mailEditor.showBcc}
            variant="standard"
            labelPosition="before"
            slotProps={{ input: { disableUnderline: true } }}
          />
        ))}

        {IF(mailEditor.showBcc, () => (
          <ComposeMailBccField
            value={mailEditor.bcc}
            variant="standard"
            labelPosition="before"
            slotProps={{ input: { disableUnderline: true } }}
          />
        ))}
      </Stack>
    </Stack>
  );
};
