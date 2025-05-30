import type { AlertColor, SnackbarProps } from '@mui/material';
import { Snackbar } from '@mui/material';
import { ONE_SEC_MSEC } from 'freedom-basic-data';
import type { ReactNode } from 'react';
import React, { useMemo } from 'react';

import { useTransientContent } from './transient-content.tsx';

export interface PresentErrorMessageOptions extends Omit<SnackbarProps, 'action' | 'message' | 'open'> {
  severity?: AlertColor;
  action?: (args: { dismiss: () => void; dismissThen: (func: () => void) => () => void }) => SnackbarProps['action'];
}

export const useMessagePresenter = () => {
  const transientContent = useTransientContent();

  return useMemo(
    () => ({
      presentErrorMessage: (message: ReactNode, { severity = 'info', action, onClose, ...props }: PresentErrorMessageOptions = {}) =>
        transientContent.present(({ dismiss }) => (
          <Snackbar
            open={true}
            onClose={(event, reason) => {
              dismiss();
              onClose?.(event, reason);
            }}
            anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
            action={
              action !== undefined
                ? action({
                    dismiss,
                    dismissThen: (func: () => void) => () => {
                      dismiss();
                      func();
                    }
                  })
                : undefined
            }
            autoHideDuration={5 * ONE_SEC_MSEC}
            {...props}
            className={`${severity} ${props.className ?? ''}`}
            message={message}
          />
        ))
    }),
    [transientContent]
  );
};
