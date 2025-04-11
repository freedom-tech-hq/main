import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import type { Binding } from 'react-bindings';
import { BC, useBinding, useCallbackRef } from 'react-bindings';
import type { TypeOrPromisedType } from 'yaschema';

import { ControlledTextField } from '../form/ControlledTextField.tsx';

const ns = 'ui';
const $cancel = LOCALIZE('Cancel')({ ns });
const $createAccount = LOCALIZE('Create Account')({ ns });
const $masterPassword = LOCALIZE('Master Password')({ ns });
const $newAccount = LOCALIZE('New Account')({ ns });
const $newAccountInstructions = LOCALIZE(
  'To begin setting up your account, enter a new master password.  Consider using a password manager and a very complex password.'
)({ ns });

export interface NewAccountMasterPasswordDialogProps {
  show: Binding<boolean>;
  onSubmit: ({ masterPassword }: { masterPassword: string }) => TypeOrPromisedType<void>;
}

export const NewAccountMasterPasswordDialog = ({ show, onSubmit }: NewAccountMasterPasswordDialogProps) => {
  const t = useT();

  const masterPassword = useBinding(() => '', { id: 'masterPassword', detectChanges: true });

  const dismiss = useCallbackRef(() => show.set(false));

  const wrappedOnSubmit = useCallbackRef(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const theMasterPassword = masterPassword.get();
    if (theMasterPassword.length === 0) {
      // TODO: show an error -- also better validation
      return;
    }

    onSubmit({ masterPassword: theMasterPassword });
  });

  return (
    <>
      {BC(show, (show) => (
        <Dialog open={show} onClose={dismiss} slotProps={{ paper: { component: 'form', onSubmit: wrappedOnSubmit } }}>
          <DialogTitle>{$newAccount(t)}</DialogTitle>
          <DialogContent>
            <DialogContentText>{$newAccountInstructions(t)}</DialogContentText>
            <ControlledTextField
              type="password"
              value={masterPassword}
              autoFocus
              required
              margin="dense"
              id="password"
              name="master-password"
              label={$masterPassword(t)}
              fullWidth
              variant="standard"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={dismiss}>{$cancel(t)}</Button>
            <Button type="submit">{$createAccount(t)}</Button>
          </DialogActions>
        </Dialog>
      ))}
    </>
  );
};
