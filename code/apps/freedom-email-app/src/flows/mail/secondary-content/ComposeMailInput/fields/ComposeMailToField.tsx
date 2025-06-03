import { Button, Stack } from '@mui/material';
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
const $to = LOCALIZE('To')({ ns });

export interface ComposeMailToFieldProps extends ControlledTextFieldProps {
  showCc: Binding<boolean>;
  showBcc: Binding<boolean>;
}

export const ComposeMailToField = ({ showCc, showBcc, ...props }: ComposeMailToFieldProps) => {
  const t = useT();

  const setShowCc = useCallbackRef(() => showCc.set(true));
  const setShowBcc = useCallbackRef(() => showBcc.set(true));

  return (
    <ControlledTextField
      label={$to(t)}
      labelPosition="above"
      helperText=""
      {...props}
      slotProps={{
        ...props.slotProps,
        input: {
          endAdornment: IF(NOT(showCc), () => (
            <Stack direction="row" gap={1}>
              <Button onClick={setShowCc} sx={{ p: 0 }}>
                <Txt variant="body2" className="semibold disabled-text">
                  {$cc(t)}
                </Txt>
              </Button>
              {IF(NOT(showBcc), () => (
                <Button onClick={setShowBcc} sx={{ p: 0 }}>
                  <Txt variant="body2" className="semibold disabled-text">
                    {$bcc(t)}
                  </Txt>
                </Button>
              ))}
            </Stack>
          )),
          ...props.slotProps?.input
        }
      }}
    />
  );
};
