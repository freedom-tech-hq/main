import { Button } from '@mui/material';
import React from 'react';
import { BC, useBinding, useCallbackRef } from 'react-bindings';

import { EyeIcon } from '../../../../icons/EyeIcon.ts';
import type { ControlledTextFieldProps } from '../ControlledTextField.tsx';
import { ControlledTextField } from '../ControlledTextField.tsx';

export type PasswordFieldProps = ControlledTextFieldProps;

export const PasswordField = (props: PasswordFieldProps) => {
  const showPassword = useBinding<boolean>(() => false, { id: 'showPassword', detectChanges: true });

  const onToggleShowPasswordClick = useCallbackRef(() => showPassword.set(!showPassword.get()));

  const defaultEndAdornment = (
    <Button sx={{ p: 1 }} onClick={onToggleShowPasswordClick}>
      {BC(showPassword, (showPassword) => (
        <EyeIcon className="sm-icon" sx={{ color: showPassword ? 'var(--colors-default-text)' : 'var(--colors-disabled-text)' }} />
      ))}
    </Button>
  );

  return BC(showPassword, (showPassword) => (
    <ControlledTextField
      type={showPassword ? 'text' : 'password'}
      autoComplete="new-password"
      required
      margin="dense"
      id="password"
      name="password"
      labelPosition="above"
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
  ));
};
