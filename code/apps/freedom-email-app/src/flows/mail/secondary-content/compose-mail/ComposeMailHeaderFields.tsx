import { Stack } from '@mui/material';
import { LOCALIZE } from 'freedom-localization';
import { IF } from 'freedom-logical-web-components';
import { useT } from 'freedom-react-localization';
import React from 'react';

import { ControlledTextField } from '../../../../components/reusable/form/ControlledTextField.tsx';
import { useMailEditor } from '../../../../contexts/mail-editor.tsx';
import { ComposeMailBccField } from './fields/ComposeMailBccField.tsx';
import { ComposeMailCcField } from './fields/ComposeMailCcField.tsx';
import { ComposeMailToField } from './fields/ComposeMailToField.tsx';

const ns = 'ui';
const $subject = LOCALIZE('Subject')({ ns });

export const ComposeMailHeaderFields = () => {
  const mailEditor = useMailEditor();
  const t = useT();

  return (
    <Stack className="flex-auto" alignItems="stretch" gap={2}>
      <ComposeMailToField autoFocus value={mailEditor.to} showCc={mailEditor.showCc} showBcc={mailEditor.showBcc} />

      {IF(mailEditor.showCc, () => (
        <ComposeMailCcField value={mailEditor.cc} showBcc={mailEditor.showBcc} />
      ))}

      {IF(mailEditor.showBcc, () => (
        <ComposeMailBccField value={mailEditor.bcc} />
      ))}

      <ControlledTextField value={mailEditor.subject} label={$subject(t)} labelPosition="above" helperText="" />
    </Stack>
  );
};
