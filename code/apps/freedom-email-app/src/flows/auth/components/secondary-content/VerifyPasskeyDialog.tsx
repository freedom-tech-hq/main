import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import React from 'react';

import { $cancel, $continue } from '../../../../consts/common-strings.ts';

const ns = 'ui';
const $instructions = LOCALIZE('To finish setting up your passkey, you will be prompted to confirm your passkey authentication.')({ ns });
const $title = LOCALIZE('Confirm Passkey')({ ns });

export interface VerifyPasskeyDialogProps {
  deny: () => void;
  confirm: () => void;
}

export const VerifyPasskeyDialog = ({ deny, confirm }: VerifyPasskeyDialogProps) => {
  const t = useT();

  return (
    <Dialog open={true} onClose={deny}>
      <DialogTitle>{$title(t)}</DialogTitle>
      <DialogContent>
        <DialogContentText>{$instructions(t)}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={deny}>{$cancel(t)}</Button>
        <Button autoFocus onClick={confirm}>
          {$continue(t)}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
