import type { CheckboxProps } from '@mui/material';
import { Checkbox } from '@mui/material';
import React from 'react';
import { type Binding, BindingsConsumer, useCallbackRef } from 'react-bindings';

import { CheckboxCheckedIcon } from '../../../icons/CheckboxCheckedIcon.ts';
import { CheckboxMixedIcon } from '../../../icons/CheckboxMixedIcon.ts';
import { EmptyIcon } from '../../../icons/EmptyIcon.ts';

export interface ControlledCheckboxProps extends Omit<CheckboxProps, 'onChange' | 'checked'> {
  checked: Binding<boolean>;
}

export const ControlledCheckbox = ({ checked, ...props }: ControlledCheckboxProps) => {
  const onChange: React.ChangeEventHandler<HTMLInputElement> = useCallbackRef((event) => {
    checked.set(event.target.checked);
  });

  const wrappedOnClick: React.MouseEventHandler<HTMLButtonElement> = useCallbackRef((event) => {
    event.stopPropagation();
    props.onClick?.(event);
  });

  return (
    <BindingsConsumer bindings={checked} limitType="none">
      {(checked) => (
        <Checkbox
          icon={<EmptyIcon className="sm-icon" />}
          checkedIcon={<CheckboxCheckedIcon className="sm-icon" />}
          indeterminateIcon={<CheckboxMixedIcon className="sm-icon" />}
          {...props}
          checked={checked}
          onChange={onChange}
          onClick={wrappedOnClick}
        />
      )}
    </BindingsConsumer>
  );
};

export const ControlledCheckboxPlaceholder = (props: Omit<ControlledCheckboxProps, 'checked'>) => (
  <Checkbox
    icon={<EmptyIcon className="sm-icon" />}
    checkedIcon={<CheckboxCheckedIcon className="sm-icon" />}
    indeterminateIcon={<CheckboxMixedIcon className="sm-icon" />}
    {...props}
    className={`ControlledCheckboxPlaceholder ${props.className ?? ''}`}
    checked={false}
  />
);
