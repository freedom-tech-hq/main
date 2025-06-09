import { Button, Stack } from '@mui/material';
import type { MailId } from 'freedom-email-api';
import { LOCALIZE } from 'freedom-localization';
import { ELSE, IF, NOT } from 'freedom-logical-web-components';
import { useT } from 'freedom-react-localization';
import React, { useRef } from 'react';
import { BC, useBinding, useBindingEffect, useCallbackRef } from 'react-bindings';

import { Txt } from '../../../../../components/reusable/aliases/Txt.ts';
import { useMailEditor } from '../../../../../contexts/mail-editor.tsx';
import { useIsSizeClass } from '../../../../../hooks/useIsSizeClass.ts';
import { useTaskWaitable } from '../../../../../hooks/useTaskWaitable.ts';
import type { ReferencedMailCompositionMode } from '../../../../../types/ReferencedMailCompositionMode.ts';
import { makeStringFromMailAddressList } from '../../../../../utils/makeStringFromMailAddressList.ts';
import { ComposeMailBccField } from '../fields/ComposeMailBccField.tsx';
import { ComposeMailCcField } from '../fields/ComposeMailCcField.tsx';
import { ComposeMailToField } from '../fields/ComposeMailToField.tsx';
import { ReferencedMailCompositionModePopupButton } from '../ReferencedMailCompositionModePopupButton.tsx';

const ns = 'ui';
const $bcc = LOCALIZE('BCC')({ ns });
const $cc = LOCALIZE('CC')({ ns });

export interface ComposeMailTopToolbarProps {
  defaultMode: ReferencedMailCompositionMode;
  referencedMailId: MailId;
}

export const ComposeMailTopToolbar = ({ defaultMode, referencedMailId }: ComposeMailTopToolbarProps) => {
  const isSmOrSmaller = useIsSizeClass('<=', 'sm');
  const mailEditor = useMailEditor();
  const t = useT();

  const referencedMail = useTaskWaitable((tasks) => tasks.getMail(undefined, referencedMailId), { id: 'referencedMail' });
  // TODO: populate the hidden inReplyTo field as well

  const mode = useBinding<ReferencedMailCompositionMode>(() => defaultMode, { id: 'mode', detectChanges: true });
  const lastDefaultMode = useRef(defaultMode);
  if (lastDefaultMode.current !== defaultMode) {
    lastDefaultMode.current = defaultMode;
    mode.set(defaultMode);
  }

  const setShowCc = useCallbackRef(() => mailEditor.showCc.set(true));
  const setShowBcc = useCallbackRef(() => mailEditor.showBcc.set(true));

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

  const fields = BC(isSmOrSmaller, (isSmOrSmaller) => (
    <Stack className="flex-auto" sx={{ px: isSmOrSmaller ? 1.5 : 0 }}>
      <ComposeMailToField
        value={mailEditor.to}
        showCc={mailEditor.showCc}
        showBcc={mailEditor.showBcc}
        hideCcButtons={isSmOrSmaller}
        variant="standard"
        labelPosition="before"
        slotProps={{ input: { disableUnderline: true } }}
      />

      {IF(mailEditor.showCc, () => (
        <ComposeMailCcField
          value={mailEditor.cc}
          showBcc={mailEditor.showBcc}
          hideCcButtons={isSmOrSmaller}
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
  ));

  return IF(
    isSmOrSmaller,
    () => (
      <Stack alignItems="stretch" sx={{ px: 1, py: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="baseline" gap={1}>
          <ReferencedMailCompositionModePopupButton mode={mode} />
          <Stack direction="row" gap={1}>
            {IF(NOT(mailEditor.showCc), () => (
              <Button onClick={setShowCc} sx={{ p: 0 }}>
                <Txt variant="body2" className="semibold muted-text">
                  {$cc(t)}
                </Txt>
              </Button>
            ))}
            {IF(NOT(mailEditor.showBcc), () => (
              <Button onClick={setShowBcc} sx={{ p: 0 }}>
                <Txt variant="body2" className="semibold muted-text">
                  {$bcc(t)}
                </Txt>
              </Button>
            ))}
          </Stack>
        </Stack>
        {fields}
      </Stack>
    ),
    ELSE(() => (
      <Stack direction="row" justifyContent="flex-start" alignItems="baseline" gap={1} sx={{ px: 1, py: 1.5 }}>
        <ReferencedMailCompositionModePopupButton mode={mode} />
        {fields}
      </Stack>
    ))
  );
};
