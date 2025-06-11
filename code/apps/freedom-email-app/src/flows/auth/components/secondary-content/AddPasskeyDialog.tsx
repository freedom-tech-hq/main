import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import React from 'react';

import { $cancel, $continue } from '../../../../consts/common-strings.ts';

const ns = 'ui';
const $instructions = [
  LOCALIZE('Using a passkey makes signing in both more convenient and secure.')({ ns }),
  LOCALIZE('Add a passkey now?')({ ns })
];
const $title = LOCALIZE('Passkey')({ ns });

export interface AddPasskeyDialogProps {
  deny: () => void;
  confirm: () => void;
}

export const AddPasskeyDialog = ({ deny, confirm }: AddPasskeyDialogProps) => {
  const t = useT();

  return (
    <Dialog open={true} onClose={deny}>
      <DialogTitle>{$title(t)}</DialogTitle>
      <DialogContent>
        {$instructions.map(($instruction, index) => (
          <DialogContentText key={index} sx={{ mt: index > 0 ? 1 : 0 }}>
            {$instruction(t)}
          </DialogContentText>
        ))}
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
