import { EmailOutlined as EmailIcon } from '@mui/icons-material';
import { Typography } from '@mui/material';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import type { ReactNode } from 'react';
import type { Binding } from 'react-bindings';
import { BC } from 'react-bindings';
import type { Waitable } from 'react-waitables';

import { getTaskWorkerConfig } from '../../../task-worker-configs/configs.ts';
import { ControlledTextField } from '../../form/ControlledTextField.tsx';

const ns = 'ui';
const $email = LOCALIZE('Email')({ ns });

export interface EmailFieldProps {
  value: Binding<string>;
  isBusy: Binding<boolean>;
  error?: Waitable<string | null>;
  startAdornment?: ReactNode;
  autoFocus?: boolean;
}

export const EmailField = ({ value, error, startAdornment = <EmailIcon sx={{ mr: 0.5 }} />, isBusy, autoFocus }: EmailFieldProps) => {
  const t = useT();

  return (
    <>
      {BC({ error: error?.value, isBusy }, ({ error = null, isBusy }) => (
        <ControlledTextField
          type="text"
          value={value}
          autoFocus={autoFocus}
          autoComplete="username"
          required
          margin="dense"
          id="username"
          name="username"
          label={$email(t)}
          fullWidth
          variant="standard"
          error={error !== null}
          helperText={error ?? ' '}
          disabled={isBusy}
          slotProps={{
            input: {
              startAdornment: startAdornment,
              endAdornment: (
                <Typography variant="body1" color="textDisabled">
                  {`@${getTaskWorkerConfig().defaultEmailDomain}`}
                </Typography>
              )
            }
          }}
        />
      ))}
    </>
  );
};
