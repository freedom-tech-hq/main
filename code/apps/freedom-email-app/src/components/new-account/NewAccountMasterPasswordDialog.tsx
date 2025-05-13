import { Button, Checkbox, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControlLabel } from '@mui/material';
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
const $newAccountInstructions = LOCALIZE(
  'To begin setting up your account, enter a new master password.  Consider using a password manager and a very complex password.'
)({ ns });
const $saveCredentials = LOCALIZE('Save encrypted credentials on our server')({ ns });
const $saveCredentialsHelp = LOCALIZE('This will allow you to recover your account using your email and password')({ ns });

export interface NewAccountMasterPasswordDialogProps {
  dismiss: () => void;
  onSubmit: ({
    masterPassword,
    saveCredentialsOnServer
  }: {
    masterPassword: string;
    saveCredentialsOnServer: boolean;
  }) => TypeOrPromisedType<void>;
}

export const NewAccountMasterPasswordDialog = ({ dismiss, onSubmit }: NewAccountMasterPasswordDialogProps) => {
  const t = useT();

  const masterPassword = useBinding(() => '', { id: 'masterPassword', detectChanges: true });
  const saveCredentialsOnServer = useBinding(() => true, { id: 'saveCredentialsOnServer', detectChanges: true });

  const wrappedOnSubmit = useCallbackRef(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const theMasterPassword = masterPassword.get();
    if (theMasterPassword.length === 0) {
      // TODO: show an error -- also better validation
      return;
    }

    onSubmit({
      masterPassword: theMasterPassword,
      saveCredentialsOnServer: saveCredentialsOnServer.get()
    });
  });

  return (
    <Dialog open={true} onClose={dismiss} slotProps={{ paper: { component: 'form', onSubmit: wrappedOnSubmit } }}>
      <DialogTitle>{$newAccount(t)}</DialogTitle>
      <DialogContent>
        <DialogContentText>{$newAccountInstructions(t)}</DialogContentText>
        <ControlledTextField
          type="password"
          value={masterPassword}
          autoFocus
          autoComplete="new-password"
          required
          margin="dense"
          id="password"
          name="master-password"
          label={$masterPassword(t)}
          fullWidth
          variant="standard"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={saveCredentialsOnServer.get()}
              onChange={(e) => saveCredentialsOnServer.set(e.target.checked)}
              color="primary"
            />
          }
          label={$saveCredentials(t)}
          sx={{ mt: 2 }}
        />
        {saveCredentialsOnServer.get() && (
          <DialogContentText variant="caption" sx={{ mt: 1, ml: 4 }}>
            {$saveCredentialsHelp(t)}
          </DialogContentText>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={dismiss}>{$cancel(t)}</Button>
        <Button type="submit">{$createAccount(t)}</Button>
      </DialogActions>
    </Dialog>
  );
};
