import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack } from '@mui/material';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import { useBinding, useCallbackRef } from 'react-bindings';
import type { TypeOrPromisedType } from 'yaschema';

import { ControlledTextField } from '../form/ControlledTextField.tsx';

const ns = 'ui';
const $cancel = LOCALIZE('Cancel')({ ns });
const $createAccount = LOCALIZE('Create Account')({ ns });
const $masterPassword = LOCALIZE('Master Password')({ ns });
const $newAccount = LOCALIZE('New Account')({ ns });
const $username = LOCALIZE('Username')({ ns });
const $newAccountInstructions = LOCALIZE(
  'To begin setting up your account, enter a username and master password. Consider using a password manager and a very complex password.'
)({ ns });

export interface NewAccountMasterPasswordDialogProps {
  dismiss: () => void;
  onSubmit: ({ username, masterPassword }: { username: string; masterPassword: string }) => TypeOrPromisedType<void>;
}

export const NewAccountMasterPasswordDialog = ({ dismiss, onSubmit }: NewAccountMasterPasswordDialogProps) => {
  const t = useT();

  const username = useBinding(() => '', { id: 'username', detectChanges: true });
  const masterPassword = useBinding(() => '', { id: 'masterPassword', detectChanges: true });

  const wrappedOnSubmit = useCallbackRef(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const theUsername = username.get();
    const theMasterPassword = masterPassword.get();
    
    if (theUsername.length === 0 || theMasterPassword.length === 0) {
      // TODO: show an error -- also better validation
      return;
    }

    onSubmit({ username: theUsername, masterPassword: theMasterPassword });
  });

  return (
    <Dialog open={true} onClose={dismiss} slotProps={{ paper: { component: 'form', onSubmit: wrappedOnSubmit } }}>
      <DialogTitle>{$newAccount(t)}</DialogTitle>
      <DialogContent>
        <DialogContentText>{$newAccountInstructions(t)}</DialogContentText>
        <ControlledTextField
          value={username}
          autoFocus
          autoComplete="username"
          required
          margin="dense"
          id="username"
          name="username"
          label={$username(t)}
          fullWidth
          variant="standard"
        />
        <ControlledTextField
          type="password"
          value={masterPassword}
          autoComplete="new-password"
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
  );
};
