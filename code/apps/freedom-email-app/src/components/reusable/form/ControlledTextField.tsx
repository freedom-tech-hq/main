import type { FilledTextFieldProps, OutlinedTextFieldProps, StandardTextFieldProps } from '@mui/material';
import { InputLabel, Stack, TextField } from '@mui/material';
import type { ReactNode } from 'react';
import type { Binding, TypeOrBindingType } from 'react-bindings';
import { BC, BindingsConsumer, ifBinding, resolveTypeOrBindingType, useCallbackRef } from 'react-bindings';

export type ControlledTextFieldProps = Omit<
  StandardTextFieldProps | FilledTextFieldProps | OutlinedTextFieldProps,
  'disabled' | 'error' | 'helperText' | 'labelPosition' | 'onChange' | 'value'
> & {
  value: Binding<string>;
  labelPosition?: 'default' | 'outside';
  disabled?: TypeOrBindingType<boolean | undefined>;
  error?: TypeOrBindingType<boolean | undefined>;
  helperText?: TypeOrBindingType<ReactNode | undefined>;
};

export const ControlledTextField = ({
  value,
  label,
  labelPosition = 'default',
  disabled,
  error,
  helperText,
  ...fwd
}: ControlledTextFieldProps) => {
  const onChange: React.ChangeEventHandler<HTMLInputElement> = useCallbackRef((event) => {
    value.set(event.target.value);
  });

  if (label === undefined) {
    labelPosition = 'default';
  }

  return (
    <>
      {BC({ disabled: ifBinding(disabled), error: ifBinding(error), helperText: ifBinding(helperText) }, () => {
        const resolvedDisabled = resolveTypeOrBindingType(disabled) ?? false;
        const resolvedError = resolveTypeOrBindingType(error) ?? false;
        const resolvedHelperText = resolveTypeOrBindingType(helperText) ?? ' ';

        switch (labelPosition) {
          case 'default':
            return (
              <BindingsConsumer bindings={value} limitType="none">
                {(value) => (
                  <TextField
                    {...fwd}
                    label={label}
                    value={value}
                    disabled={resolvedDisabled}
                    error={resolvedError}
                    helperText={resolvedHelperText}
                    onChange={onChange}
                  />
                )}
              </BindingsConsumer>
            );
          case 'outside':
            return (
              <Stack>
                <InputLabel
                  shrink={false}
                  htmlFor={'password'}
                  className="outside medium"
                  error={resolvedError}
                  disabled={resolvedDisabled}
                >
                  {label}
                </InputLabel>
                <BindingsConsumer bindings={value} limitType="none">
                  {(value) => (
                    <TextField
                      {...fwd}
                      value={value}
                      disabled={resolvedDisabled}
                      error={resolvedError}
                      helperText={resolvedHelperText}
                      onChange={onChange}
                    />
                  )}
                </BindingsConsumer>
              </Stack>
            );
        }
      })}
    </>
  );
};
