import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import type { Uuid } from 'freedom-basic-data';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import type { Binding } from 'react-bindings';
import { BC, useBinding, useCallbackRef, useDerivedBinding } from 'react-bindings';
import type { TypeOrPromisedType } from 'yaschema';

import { ControlledTextField } from '../form/ControlledTextField.tsx';

const ns = 'ui';
const $cancel = LOCALIZE('Cancel')({ ns });
const $unlockAccount = LOCALIZE('Unlock Account')({ ns });
const $masterPassword = LOCALIZE('Master Password')({ ns });
const $unlockAccountInstructions = LOCALIZE(
  'Your account information is protected with a master password.  Enter it to unlock your account.'
)({ ns });

export interface UnlockAccountMasterPasswordDialogProps {
  config: Binding<{ localCredentialUuid: Uuid } | undefined>;
  onSubmit: ({ localCredentialUuid, masterPassword }: { localCredentialUuid: Uuid; masterPassword: string }) => TypeOrPromisedType<void>;
}

export const UnlockAccountMasterPasswordDialog = ({ config, onSubmit }: UnlockAccountMasterPasswordDialogProps) => {
  const t = useT();

  const masterPassword = useBinding(() => '', { id: 'masterPassword', detectChanges: true });

  const show = useDerivedBinding(config, (config) => config !== undefined, { id: 'show' });
  const dismiss = useCallbackRef(() => config.set(undefined));

  const wrappedOnSubmit = useCallbackRef(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const localCredentialUuid = config.get()?.localCredentialUuid;
    if (localCredentialUuid === undefined) {
      return;
    }

    const theMasterPassword = masterPassword.get();
    if (theMasterPassword.length === 0) {
      // TODO: show an error -- also better validation
      return;
    }

    onSubmit({ localCredentialUuid, masterPassword: theMasterPassword });
  });

  return (
    <>
      {BC(show, (show) => (
        <Dialog open={show} onClose={dismiss} slotProps={{ paper: { component: 'form', onSubmit: wrappedOnSubmit } }}>
          <DialogTitle>{$unlockAccount(t)}</DialogTitle>
          <DialogContent>
            <DialogContentText>{$unlockAccountInstructions(t)}</DialogContentText>
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
            <Button type="submit">{$unlockAccount(t)}</Button>
          </DialogActions>
        </Dialog>
      ))}
    </>
  );
};
