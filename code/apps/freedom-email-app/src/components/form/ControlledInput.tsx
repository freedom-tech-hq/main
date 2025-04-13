import type { InputProps } from '@mui/material';
import { Input } from '@mui/material';
import type { Binding } from 'react-bindings';
import { BindingsConsumer, useCallbackRef } from 'react-bindings';

export type ControlledInputProps = InputProps & {
  value: Binding<string>;
};

export const ControlledInput = ({ value, ...fwd }: ControlledInputProps) => {
  const onChange: React.ChangeEventHandler<HTMLInputElement> = useCallbackRef((event) => {
    value.set(event.target.value);
  });

  return (
    <BindingsConsumer bindings={value} limitType="none">
      {(value) => <Input {...fwd} value={value} onChange={onChange} />}
    </BindingsConsumer>
  );
};
