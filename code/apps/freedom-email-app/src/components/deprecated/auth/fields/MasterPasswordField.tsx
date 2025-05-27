import { LockOutlined as MasterPasswordIcon } from '@mui/icons-material';
import type { StandardTextFieldProps } from '@mui/material';
import { Box } from '@mui/material';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import type { Binding } from 'react-bindings';
import { BC } from 'react-bindings';
import type { Waitable } from 'react-waitables';

import { ControlledTextField } from '../../../reusable/form/ControlledTextField.tsx';

const ns = 'ui';
const $masterPassword = LOCALIZE('Master Password')({ ns });

export interface MasterPasswordFieldProps {
  value: Binding<string>;
  isBusy: Binding<boolean>;
  error?: Waitable<string | null>;
  autoFocus?: boolean;
}

export const MasterPasswordField = ({ value, error, isBusy, autoFocus }: MasterPasswordFieldProps) => {
  const t = useT();

  return (
    <>
      {BC({ error: error?.value, isBusy }, ({ error = null, isBusy }) => (
        <ControlledTextField
          type="password"
          value={value}
          autoComplete="new-password"
          autoFocus={autoFocus}
          required
          margin="dense"
          id="password"
          name="master-password"
          label={$masterPassword(t)}
          fullWidth
          variant="standard"
          error={error !== null}
          disabled={isBusy}
          helperText={error ?? ' '}
          slotProps={passwordSlotProps}
        />
      ))}
    </>
  );
};

// Helpers

const passwordSlotProps: StandardTextFieldProps['slotProps'] = {
  input: {
    startAdornment: (
      <Box sx={{ mr: 0.5 }}>
        <MasterPasswordIcon />
      </Box>
    )
  }
};
