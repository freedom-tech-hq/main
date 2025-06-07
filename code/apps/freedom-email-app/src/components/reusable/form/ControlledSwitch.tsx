import type { SwitchProps } from '@mui/material';
import { Switch } from '@mui/material';
import React from 'react';
import { type Binding, BindingsConsumer, useCallbackRef } from 'react-bindings';

export interface ControlledSwitchProps extends Omit<SwitchProps, 'onChange' | 'checked'> {
  checked: Binding<boolean>;
}

export const ControlledSwitch = ({ checked, ...props }: ControlledSwitchProps) => {
  const onChange: React.ChangeEventHandler<HTMLInputElement> = useCallbackRef((event) => {
    checked.set(event.target.checked);
  });

  return (
    <BindingsConsumer bindings={checked} limitType="none">
      {(checked) => <Switch {...props} checked={checked} onChange={onChange} />}
    </BindingsConsumer>
  );
};

export const ControlledSwitchPlaceholder = (props: Omit<ControlledSwitchProps, 'checked'>) => (
  <Switch {...props} checked={false} className={`ControlledSwitchPlaceholder ${props.className ?? ''}`} />
);
