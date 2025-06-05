import { Stack } from '@mui/material';
import type { MailId } from 'freedom-email-api';
import { IF } from 'freedom-logical-web-components';
import React, { useRef } from 'react';
import { useBinding, useBindingEffect } from 'react-bindings';

import type { ReferencedMailCompositionMode } from '../../../../../types/ReferencedMailCompositionMode.ts';
import { ComposeMailBccField } from '../fields/ComposeMailBccField.tsx';
import { ComposeMailCcField } from '../fields/ComposeMailCcField.tsx';
import { ComposeMailToField } from '../fields/ComposeMailToField.tsx';
import { ReferencedMailCompositionModePopupButton } from '../ReferencedMailCompositionModePopupButton.tsx';

export interface ComposeMailTopToolbarProps {
  defaultMode: ReferencedMailCompositionMode;
  referencedMailId: MailId;
}

export const ComposeMailTopToolbar = ({ defaultMode }: ComposeMailTopToolbarProps) => {
  // TODO: populate the hidden inReplyTo field as well

  const to = useBinding(
    () => {
      switch (defaultMode) {
        case 'forward':
          return '';
        case 'reply':
        case 'reply-all':
          // TODO: get the referenced mail and populate the relevate fields
          return '';
      }
    },
    { id: 'to', detectChanges: true }
  );
  const cc = useBinding(
    () => {
      switch (defaultMode) {
        case 'forward':
        case 'reply':
          return '';
        case 'reply-all':
          // TODO: hook up cc field
          return '';
      }
    },
    { id: 'cc', detectChanges: true }
  );
  const bcc = useBinding(() => '', { id: 'bcc', detectChanges: true });

  const mode = useBinding<ReferencedMailCompositionMode>(() => defaultMode, { id: 'mode', detectChanges: true });
  const lastDefaultMode = useRef(defaultMode);
  if (lastDefaultMode.current !== defaultMode) {
    lastDefaultMode.current = defaultMode;
    mode.set(defaultMode);
  }

  useBindingEffect(mode, () => {
    to.reset();
    cc.reset();
    bcc.reset();
  });

  const showCc = useBinding(() => false, { id: 'showCc', detectChanges: true });
  const showBcc = useBinding(() => false, { id: 'showBcc', detectChanges: true });

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
