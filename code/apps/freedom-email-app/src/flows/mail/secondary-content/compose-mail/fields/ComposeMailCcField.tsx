import { Button } from '@mui/material';
import { LOCALIZE } from 'freedom-localization';
import { IF, NOT } from 'freedom-logical-web-components';
import { useT } from 'freedom-react-localization';
import React from 'react';
import { type Binding, useCallbackRef } from 'react-bindings';

import { Txt } from '../../../../../components/reusable/aliases/Txt.ts';
import type { ControlledTextFieldProps } from '../../../../../components/reusable/form/ControlledTextField.tsx';
import { ControlledTextField } from '../../../../../components/reusable/form/ControlledTextField.tsx';

const ns = 'ui';
const $bcc = LOCALIZE('BCC')({ ns });
const $cc = LOCALIZE('CC')({ ns });

export interface ComposeMailCcFieldProps extends ControlledTextFieldProps {
  showBcc: Binding<boolean>;
  hideCcButtons?: boolean;
}

export const ComposeMailCcField = ({ showBcc, hideCcButtons = false, ...props }: ComposeMailCcFieldProps) => {
  const t = useT();

  const setShowBcc = useCallbackRef(() => showBcc.set(true));

  return (
    <ControlledTextField
      label={$cc(t)}
      labelPosition="above"
      helperText=""
      {...props}
      slotProps={{
        ...props.slotProps,
        input: {
          endAdornment: IF([!hideCcButtons, NOT(showBcc)], () => (
            <Button onClick={setShowBcc} sx={{ p: 0 }}>
              <Txt variant="body2" className="semibold muted-text">
                {$bcc(t)}
              </Txt>
            </Button>
          )),
          ...props.slotProps?.input
        }
      }}
    />
  );
};
