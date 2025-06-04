import type { StandardTextFieldProps } from '@mui/material';
import { TextField } from '@mui/material';
import type { Binding } from 'react-bindings';
import { BindingsConsumer, useCallbackRef } from 'react-bindings';

export interface ControlledTextFieldProps extends StandardTextFieldProps {
  value: Binding<string>;
}

export const ControlledTextField = ({ value, ...fwd }: ControlledTextFieldProps) => {
  const onChange: React.ChangeEventHandler<HTMLInputElement> = useCallbackRef((event) => {
    value.set(event.target.value);
  });

  return (
    <BindingsConsumer bindings={value} limitType="none">
      {(value) => <TextField {...fwd} value={value} onChange={onChange} />}
    </BindingsConsumer>
  );
};
