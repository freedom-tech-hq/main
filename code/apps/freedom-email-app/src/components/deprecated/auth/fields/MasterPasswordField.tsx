import { Button } from '@mui/material';
import { BC, useBinding, useCallbackRef } from 'react-bindings';

import { EyeIcon } from '../../../../icons/EyeIcon.ts';
import type { ControlledTextFieldProps } from '../../../reusable/form/ControlledTextField.tsx';
import { ControlledTextField } from '../../../reusable/form/ControlledTextField.tsx';

export type MasterPasswordFieldProps = ControlledTextFieldProps;

export const MasterPasswordField = (props: MasterPasswordFieldProps) => {
  const showPassword = useBinding<boolean>(() => false, { id: 'showPassword', detectChanges: true });

  const onToggleShowPasswordClick = useCallbackRef(() => showPassword.set(!showPassword.get()));

  const defaultEndAdornment = (
    <Button sx={{ minWidth: 0, p: 1 }} onClick={onToggleShowPasswordClick}>
      {BC(showPassword, (showPassword) => (
        <EyeIcon className="sm-icon" sx={{ color: showPassword ? 'var(--colors-default-text)' : 'var(--colors-disabled-text)' }} />
      ))}
    </Button>
  );

  return (
    <>
      {BC(showPassword, (showPassword) => (
        <ControlledTextField
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          required
          margin="dense"
          id="password"
          name="master-password"
          labelPosition="outside"
          fullWidth
          variant="outlined"
          {...props}
          slotProps={{
            ...props.slotProps,
            input: {
              sx: { pr: '6px' },
              endAdornment: defaultEndAdornment,
              ...props.slotProps?.input
            }
          }}
        />
      ))}
    </>
  );
};
