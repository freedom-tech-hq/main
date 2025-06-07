import { Stack } from '@mui/material';
import type { MailId } from 'freedom-email-api';
import { IF } from 'freedom-logical-web-components';
import React, { useRef } from 'react';
import type { Binding } from 'react-bindings';
import { useBinding, useBindingEffect } from 'react-bindings';

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
  to: Binding<string>;
  cc: Binding<string>;
  showCc: Binding<boolean>;
  bcc: Binding<string>;
  showBcc: Binding<boolean>;
  subject: Binding<string>;
}

export const ComposeMailTopToolbar = ({
  defaultMode,
  referencedMailId,
  to,
  cc,
  showCc,
  bcc,
  showBcc,
  subject
}: ComposeMailTopToolbarProps) => {
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
          to.set('');
          cc.set('');
          break;
        case 'reply':
          to.set(makeStringFromMailAddressList(referencedMail.from));
          cc.set('');
          break;
        case 'reply-all':
          to.set(makeStringFromMailAddressList(referencedMail.from));
          cc.set(makeStringFromMailAddressList([...referencedMail.to, ...referencedMail.cc]));
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

      subject.set(referencedMail.subject);
    },
    { triggerOnMount: 'first' }
  );

  return (
    <Stack direction="row" justifyContent="flex-start" alignItems="baseline" gap={1} sx={{ px: 1, py: 1.5 }}>
      <ReferencedMailCompositionModePopupButton mode={mode} />
      <Stack sx={{ flex: 1 }}>
        <ComposeMailToField
          value={to}
          showCc={showCc}
          showBcc={showBcc}
          variant="standard"
          labelPosition="before"
          slotProps={{ input: { disableUnderline: true } }}
        />

        {IF(showCc, () => (
          <ComposeMailCcField
            value={cc}
            showBcc={showBcc}
            variant="standard"
            labelPosition="before"
            slotProps={{ input: { disableUnderline: true } }}
          />
        ))}

        {IF(showBcc, () => (
          <ComposeMailBccField value={bcc} variant="standard" labelPosition="before" slotProps={{ input: { disableUnderline: true } }} />
        ))}
      </Stack>
    </Stack>
  );
};
