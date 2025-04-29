import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { LOCALIZE } from 'freedom-localization';
import { IF } from 'freedom-logical-web-components';
import { useT } from 'freedom-react-localization';
import type { ReactNode } from 'react';
import type { TypeOrDeferredType } from 'react-bindings';
import { resolveTypeOrDeferredType } from 'react-bindings';

const ns = 'ui';
const $defaultAffirmativeButtonTitle = LOCALIZE('Yes')({ ns });
const $defaultNegativeButtonTitle = LOCALIZE('No')({ ns });

export interface ConfirmationDialogProps {
  dismiss: () => void;
  titleIcon?: TypeOrDeferredType<ReactNode>;
  title?: string;
  message?: string;
  /** @defaultValue localized "Yes" */
  affirmativeButtonTitle?: string;
  /** @defaultValue localized "No" */
  negativeButtonTitle?: string;
  onConfirm: () => void;
}

export const ConfirmationDialog = ({
  dismiss,
  titleIcon,
  title,
  message,
  affirmativeButtonTitle,
  negativeButtonTitle,
  onConfirm
}: ConfirmationDialogProps) => {
  const t = useT();

  return (
    <Dialog open={true} onClose={dismiss} aria-labelledby="responsive-dialog-title">
      {IF(titleIcon !== undefined, () => (
        <DialogTitle align="center">{resolveTypeOrDeferredType(titleIcon!)}</DialogTitle>
      ))}
      {IF((title?.length ?? 0) > 0, () => (
        <DialogTitle>{title}</DialogTitle>
      ))}
      {IF((message?.length ?? 0) > 0, () => (
        <DialogContent>
          <DialogContentText>{message}</DialogContentText>
        </DialogContent>
      ))}
      <DialogActions>
        <Button autoFocus onClick={dismiss}>
          {negativeButtonTitle ?? $defaultNegativeButtonTitle(t)}
        </Button>
        <Button autoFocus onClick={onConfirm}>
          {affirmativeButtonTitle ?? $defaultAffirmativeButtonTitle(t)}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
