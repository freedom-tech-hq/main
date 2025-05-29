import { Chip } from '@mui/material';

import { getTaskWorkerConfig } from '../../../../task-worker-configs/configs.ts';
import type { ControlledTextFieldProps } from '../ControlledTextField.tsx';
import { ControlledTextField } from '../ControlledTextField.tsx';

export type EmailFieldProps = ControlledTextFieldProps;

export const EmailField = (props: EmailFieldProps) => {
  const defaultEndAdornment = (
    <Chip className="muted-color-bg" disabled label={`@${getTaskWorkerConfig().defaultEmailDomain}`} sx={{ ml: 0.5 }} />
  );

  return (
    <ControlledTextField
      type="text"
      autoComplete="username"
      required
      margin="dense"
      id="username"
      name="username"
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
  );
};
