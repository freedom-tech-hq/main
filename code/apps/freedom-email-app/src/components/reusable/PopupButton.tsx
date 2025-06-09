import type { ButtonProps, PopoverProps } from '@mui/material';
import { Button, Popover } from '@mui/material';
import { IF } from 'freedom-logical-web-components';
import type { ReactNode } from 'react';
import React, { useRef } from 'react';
import type { Binding } from 'react-bindings';
import { BC, useBinding, useCallbackRef } from 'react-bindings';

import { DropdownIcon } from '../../icons/DropdownIcon.ts';

export interface PopupButtonProps<T> {
  value: Binding<T>;
  renderSelectedValue: (value: T) => ReactNode;
  renderPopoverContents: (args: { hide: () => void; selectValue: (value: T, hide?: boolean) => void }) => ReactNode;

  buttonProps?: Omit<ButtonProps, 'ref'>;
  popoverProps?: Omit<PopoverProps, 'anchorEl' | 'onClose' | 'open'> & { onClose?: () => void };
}

export const PopupButton = <T,>({ value, renderSelectedValue, renderPopoverContents, buttonProps, popoverProps }: PopupButtonProps<T>) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const shouldShowPopupForElem = useBinding<HTMLElement | undefined>(() => undefined, { id: 'shouldShowPopup', detectChanges: true });
  const wrappedOnButtonClick: React.MouseEventHandler<HTMLButtonElement> = useCallbackRef((event) => {
    buttonProps?.onClick?.(event);
    shouldShowPopupForElem.set(buttonRef.current!);
  });
  const wrappedOnClosePopup = useCallbackRef(() => {
    shouldShowPopupForElem.set(undefined);
    popoverProps?.onClose?.();
  });

  const selectValue = useCallbackRef((newValue: T, hide: boolean = true) => {
    value.set(newValue);

    if (hide) {
      shouldShowPopupForElem.set(undefined);
      popoverProps?.onClose?.();
    }
  });

  return (
    <>
      {BC(value, (value) => (
        <Button endIcon={<DropdownIcon className="sm-icon muted-text" />} {...buttonProps} ref={buttonRef} onClick={wrappedOnButtonClick}>
          {renderSelectedValue(value)}
        </Button>
      ))}
      {BC(shouldShowPopupForElem, (shouldShowPopupForElem) => (
        <Popover
          {...popoverProps}
          open={shouldShowPopupForElem !== undefined}
          onClose={wrappedOnClosePopup}
          anchorEl={shouldShowPopupForElem}
        >
          {IF(shouldShowPopupForElem !== undefined, () => renderPopoverContents({ hide: wrappedOnClosePopup, selectValue }))}
        </Popover>
      ))}
    </>
  );
};
